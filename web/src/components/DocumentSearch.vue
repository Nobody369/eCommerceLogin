<template>
  <div class="search-container">
    <div class="search-header">
      <h2>Universal Search</h2>
      <p>Search through documents and products - suggestions appear as you type</p>
      
      <div class="search-type-selector">
        <label>
          <input 
            type="radio" 
            v-model="searchType" 
            value="mixed"
          />
          Mixed Search (Documents + Products)
        </label>
        <label>
          <input 
            type="radio" 
            v-model="searchType" 
            value="documents"
          />
          Documents Only
        </label>
        <label>
          <input 
            type="radio" 
            v-model="searchType" 
            value="products"
          />
          Products Only
        </label>
      </div>
    </div>
    
    <div class="search-bar">
      <div class="search-input-container">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Type to search documents..."
          class="search-input"
          :disabled="isSearching"
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          @keydown="handleKeydown"
        />
        <div v-if="isSearching" class="search-loading">
          <div class="spinner"></div>
        </div>
        
        <!-- Search Suggestions Dropdown -->
        <div 
          v-if="showSuggestions && (productSuggestions.length > 0 || documentSuggestions.length > 0)" 
          class="suggestions-dropdown"
        >
          <!-- Products Suggestions -->
          <div v-if="productSuggestions.length > 0" class="suggestion-group">
            <div class="suggestion-group-header">
              🛍️ Products ({{ productSuggestions.length }})
            </div>
            <div 
              v-for="(suggestion, index) in productSuggestions" 
              :key="suggestion.id"
              :class="['suggestion-item', 'suggestion-product', { 'highlighted': highlightedIndex === getSuggestionIndex(suggestion) }]"
              @click="selectSuggestion(suggestion)"
              @mouseenter="highlightedIndex = getSuggestionIndex(suggestion)"
            >
              <div class="suggestion-header">
                <div class="suggestion-title">
                  {{ suggestion.title || suggestion.filename }}
                </div>
                <div class="suggestion-price">${{ suggestion.price }}</div>
              </div>
              <div class="suggestion-preview">
                {{ suggestion.preview }}
              </div>
            </div>
          </div>

          <!-- Documents Suggestions -->
          <div v-if="documentSuggestions.length > 0" class="suggestion-group">
            <div class="suggestion-group-header">
              📄 Documents ({{ documentSuggestions.length }})
            </div>
            <div 
              v-for="(suggestion, index) in documentSuggestions" 
              :key="suggestion.id"
              :class="['suggestion-item', 'suggestion-document', { 'highlighted': highlightedIndex === getSuggestionIndex(suggestion) }]"
              @click="selectSuggestion(suggestion)"
              @mouseenter="highlightedIndex = getSuggestionIndex(suggestion)"
            >
              <div class="suggestion-header">
                <div class="suggestion-title">
                  {{ suggestion.title || suggestion.filename }}
                </div>
              </div>
              <div class="suggestion-preview">
                {{ suggestion.preview }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        <h3>Search Results ({{ searchResults.length }})</h3>
        <p v-if="searchQuery.trim()">
          Query: "{{ searchQuery }}" | Mode: {{ getSearchModeText() }}
          <span v-if="searchBreakdown" class="breakdown">
            ({{ searchBreakdown.documents }} docs, {{ searchBreakdown.products }} products)
          </span>
        </p>
      </div>
      
      <!-- Products Section -->
      <div v-if="productResults.length > 0" class="results-section">
        <div class="section-header">
          <h4 class="section-title">
            🛍️ Products ({{ productResults.length }})
          </h4>
        </div>
        <div class="results-list">
          <div 
            v-for="result in productResults" 
            :key="result.id"
            class="result-item result-product"
          >
            <div class="result-header">
              <h4>{{ result.title }}</h4>
              <div class="result-meta">
                <span class="similarity-score">
                  {{ Math.round(result.similarity * 100) }}% match
                </span>
                <span class="price-info">${{ result.price }}</span>
              </div>
            </div>
            
            <div class="result-content">
              <p>{{ result.content }}</p>
              <div class="product-details">
                <span v-if="result.category" class="category">{{ result.category }}</span>
              </div>
            </div>
            
            <div class="result-actions">
              <button 
                class="view-product-btn"
                @click="viewProduct(result)"
              >
                View Product
              </button>
              <span class="date-info">
                Added: {{ formatDate(result.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Section -->
      <div v-if="documentResults.length > 0" class="results-section">
        <div class="section-header">
          <h4 class="section-title">
            📄 Documents ({{ documentResults.length }})
          </h4>
        </div>
        <div class="results-list">
          <div 
            v-for="result in documentResults" 
            :key="result.id"
            class="result-item result-document"
          >
            <div class="result-header">
              <h4>{{ result.title }}</h4>
              <div class="result-meta">
                <span class="similarity-score">
                  {{ Math.round(result.similarity * 100) }}% match
                </span>
                <span class="file-info">{{ result.filename }}</span>
              </div>
            </div>
            
            <div class="result-content">
              <p>{{ result.content }}</p>
            </div>
            
            <div class="result-actions">
              <a 
                :href="result.filePath" 
                target="_blank" 
                class="view-pdf-btn"
              >
                View PDF
              </a>
              <span class="date-info">
                Uploaded: {{ formatDate(result.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="searchError" class="error-message">
      <p>{{ searchError }}</p>
    </div>

    <div v-if="!isSearching && searchResults.length === 0 && searchQuery.trim()" class="no-results">
      <p>No documents found matching "{{ searchQuery }}".</p>
      <p>Try different keywords or check if documents have been uploaded.</p>
    </div>

    <div v-if="!searchQuery.trim() && !isSearching" class="welcome-message">
      <p>Start typing to search through your documents...</p>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import axios from 'axios'

export default {
  name: 'DocumentSearch',
  setup() {
    const searchQuery = ref('')
    const searchResults = ref([])
    const suggestions = ref([])
    const isSearching = ref(false)
    const searchError = ref('')
    const searchInput = ref(null)
    const showSuggestions = ref(false)
    const highlightedIndex = ref(-1)
    const searchType = ref('mixed')
    const searchBreakdown = ref(null)
    let searchTimeout = null
    let suggestionsTimeout = null

    // 计算属性：按类型分组结果
    const productResults = computed(() => {
      return searchResults.value.filter(result => result.type === 'product')
    })

    const documentResults = computed(() => {
      return searchResults.value.filter(result => result.type === 'document')
    })

    // 建议分组计算属性
    const productSuggestions = computed(() => {
      return suggestions.value.filter(suggestion => suggestion.type === 'product')
    })

    const documentSuggestions = computed(() => {
      return suggestions.value.filter(suggestion => suggestion.type === 'document')
    })

    // 获取建议在总列表中的索引
    const getSuggestionIndex = (suggestion) => {
      return suggestions.value.findIndex(s => s.id === suggestion.id)
    }

    // 获取搜索建议
    const getSuggestions = async (query) => {
      if (suggestionsTimeout) {
        clearTimeout(suggestionsTimeout)
      }
      
      suggestionsTimeout = setTimeout(async () => {
        if (!query.trim() || query.trim().length < 2) {
          suggestions.value = []
          return
        }

        try {
          const token = localStorage.getItem('token')
          const response = await axios.get('/api/search/suggestions', {
            params: { q: query, limit: 8 },
            headers: {
              Authorization: `Bearer ${token}`
            }
          })

          suggestions.value = response.data.suggestions
          highlightedIndex.value = -1
        } catch (error) {
          console.error('Suggestions error:', error)
          suggestions.value = []
        }
      }, 150) // 建议延迟更短
    }

    // 执行完整搜索
    const performSearch = async (query) => {
      if (!query.trim()) {
        searchResults.value = []
        searchBreakdown.value = null
        return
      }

      isSearching.value = true
      searchError.value = ''
      showSuggestions.value = false

      try {
        const token = localStorage.getItem('token')
        let response

        if (searchType.value === 'mixed') {
          response = await axios.post('/api/search/mixed', {
            query: query,
            limit: 10,
            documentRatio: 0.6,
            productRatio: 0.4
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          searchBreakdown.value = response.data.breakdown
        } else if (searchType.value === 'documents') {
          response = await axios.post('/api/search', {
            query: query,
            limit: 10
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          searchBreakdown.value = null
        } else if (searchType.value === 'products') {
          // For now, we'll use mixed search with 100% products
          response = await axios.post('/api/search/mixed', {
            query: query,
            limit: 10,
            documentRatio: 0,
            productRatio: 1.0
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          searchBreakdown.value = response.data.breakdown
        }

        searchResults.value = response.data.results
      } catch (error) {
        console.error('Search error:', error)
        searchError.value = error.response?.data?.error || 'Search failed. Please try again.'
        searchResults.value = []
        searchBreakdown.value = null
      } finally {
        isSearching.value = false
      }
    }

    // 选择建议
    const selectSuggestion = (suggestion) => {
      searchQuery.value = suggestion.title || suggestion.filename
      showSuggestions.value = false
      suggestions.value = []
      performSearch(searchQuery.value)
    }

    // 键盘导航
    const handleKeydown = (event) => {
      if (!showSuggestions.value || suggestions.value.length === 0) {
        if (event.key === 'Enter') {
          performSearch(searchQuery.value)
        }
        return
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1)
          break
        case 'ArrowUp':
          event.preventDefault()
          highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex.value >= 0) {
            selectSuggestion(suggestions.value[highlightedIndex.value])
          } else {
            performSearch(searchQuery.value)
          }
          break
        case 'Escape':
          showSuggestions.value = false
          suggestions.value = []
          highlightedIndex.value = -1
          break
      }
    }

    // 隐藏建议
    const hideSuggestions = () => {
      setTimeout(() => {
        showSuggestions.value = false
      }, 200) // 延迟隐藏，允许点击
    }

    // 监听搜索查询变化
    watch(searchQuery, (newQuery) => {
      if (newQuery.trim()) {
        getSuggestions(newQuery)
        showSuggestions.value = true
      } else {
        suggestions.value = []
        searchResults.value = []
        showSuggestions.value = false
      }
    })

    // 监听搜索类型变化
    watch(searchType, () => {
      // 清空之前的结果
      searchResults.value = []
      suggestions.value = []
      searchBreakdown.value = null
      showSuggestions.value = false
      
      // 如果有搜索查询，重新搜索
      if (searchQuery.value.trim()) {
        performSearch(searchQuery.value)
      }
    })

    // 组件挂载后保持焦点
    onMounted(() => {
      nextTick(() => {
        if (searchInput.value) {
          searchInput.value.focus()
        }
      })
    })

    // 组件卸载时清理定时器
    onUnmounted(() => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      if (suggestionsTimeout) {
        clearTimeout(suggestionsTimeout)
      }
    })

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 获取搜索模式文本
    const getSearchModeText = () => {
      switch (searchType.value) {
        case 'mixed': return 'Mixed Search'
        case 'documents': return 'Documents Only'
        case 'products': return 'Products Only'
        default: return 'Unknown'
      }
    }

    // 查看产品详情
    const viewProduct = (product) => {
      // 这里可以添加产品详情页面逻辑
      console.log('Viewing product:', product)
      alert(`Product: ${product.title}\nPrice: $${product.price}\nCategory: ${product.category}`)
    }

    return {
      searchQuery,
      searchResults,
      suggestions,
      isSearching,
      searchError,
      searchInput,
      showSuggestions,
      highlightedIndex,
      searchType,
      searchBreakdown,
      selectSuggestion,
      handleKeydown,
      hideSuggestions,
      getSearchModeText,
      viewProduct,
      formatDate,
      productResults,
      documentResults,
      productSuggestions,
      documentSuggestions,
      getSuggestionIndex
    }
  }
}
</script>

<style scoped>
.search-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-header {
  text-align: center;
  margin-bottom: 2rem;
}

.search-header h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.search-header p {
  color: #666;
  font-size: 1.1rem;
}

.search-type-selector {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.search-type-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.search-type-selector label:hover {
  background-color: #f8f9fa;
}

.search-type-selector input[type="radio"] {
  margin: 0;
}

.search-type-selector input[type="radio"]:checked + span,
.search-type-selector label:has(input:checked) {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.search-bar {
  margin-bottom: 2rem;
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-group {
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-group:last-child {
  border-bottom: none;
}

.suggestion-group-header {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 10;
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background-color: #f8f9fa;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.suggestion-type-badge {
  font-size: 1rem;
}

.suggestion-title {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.suggestion-preview {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
}

.suggestion-product {
  border-left: 3px solid #28a745;
}

.suggestion-document {
  border-left: 3px solid #17a2b8;
}

.suggestion-price {
  color: #28a745;
  font-weight: bold;
  font-size: 0.9rem;
}

.search-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.search-loading {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.search-results {
  margin-top: 2rem;
}

.results-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.results-header h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.results-header p {
  color: #666;
  font-style: italic;
}

.breakdown {
  color: #007bff;
  font-weight: bold;
}

.results-list {
  display: grid;
  gap: 1.5rem;
}

.results-section {
  margin-bottom: 2rem;
}

.section-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.section-title {
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.result-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.3s ease;
}

.result-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.result-document {
  border-left: 4px solid #17a2b8;
}

.result-product {
  border-left: 4px solid #28a745;
}

.result-type-badge {
  display: inline-block;
  background: #f8f9fa;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.result-header {
  margin-bottom: 1rem;
}

.result-header h4 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.result-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.9rem;
}

.similarity-score {
  background: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.file-info {
  color: #666;
}

.price-info {
  color: #28a745;
  font-weight: bold;
}

.product-details {
  margin-top: 0.5rem;
}

.category {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.result-content {
  margin-bottom: 1rem;
}

.result-content p {
  color: #555;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.view-pdf-btn {
  background: #17a2b8;
  color: white;
  padding: 0.5rem 1rem;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.view-pdf-btn:hover {
  background: #138496;
}

.view-product-btn {
  background: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.view-product-btn:hover {
  background: #218838;
}

.upload-date,
.date-info {
  color: #666;
  font-size: 0.9rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.no-results p {
  margin-bottom: 0.5rem;
}

.welcome-message {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-style: italic;
}

@media (max-width: 768px) {
  .search-container {
    padding: 1rem;
  }
  
  .search-input-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-loading {
    position: static;
    transform: none;
    align-self: center;
  }
  
  .suggestions-dropdown {
    position: fixed;
    top: auto;
    left: 1rem;
    right: 1rem;
    max-height: 200px;
  }
  
  .result-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .result-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
