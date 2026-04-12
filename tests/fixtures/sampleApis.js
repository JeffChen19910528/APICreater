/**
 * 測試用 API 定義 fixtures
 */

// 基本 CRUD API 集合
const BASIC_APIS = [
  {
    id: 1,
    method: 'GET',
    path: '/users',
    description: '取得所有使用者',
    requestSchema: {},
    responseSchema: {
      id: 'int',
      name: 'string',
      email: 'string',
      active: 'boolean'
    }
  },
  {
    id: 2,
    method: 'POST',
    path: '/users',
    description: '建立使用者',
    requestSchema: {
      name: 'string',
      email: 'string'
    },
    responseSchema: {
      id: 'int',
      name: 'string',
      email: 'string'
    }
  },
  {
    id: 3,
    method: 'GET',
    path: '/users/:id',
    description: '取得單一使用者',
    requestSchema: {},
    responseSchema: {
      id: 'int',
      name: 'string'
    }
  },
  {
    id: 4,
    method: 'PUT',
    path: '/users/:id',
    description: '更新使用者',
    requestSchema: {
      name: 'string',
      email: 'string'
    },
    responseSchema: {
      id: 'int',
      name: 'string'
    }
  },
  {
    id: 5,
    method: 'DELETE',
    path: '/users/:id',
    description: '刪除使用者',
    requestSchema: {},
    responseSchema: {
      message: 'string'
    }
  }
];

// 多資源 API（users + products）
const MULTI_RESOURCE_APIS = [
  {
    id: 10,
    method: 'GET',
    path: '/users',
    description: '取得使用者列表',
    requestSchema: {},
    responseSchema: { id: 'int', name: 'string' }
  },
  {
    id: 11,
    method: 'GET',
    path: '/products',
    description: '取得商品列表',
    requestSchema: {},
    responseSchema: { id: 'int', title: 'string', price: 'number' }
  },
  {
    id: 12,
    method: 'POST',
    path: '/products',
    description: '新增商品',
    requestSchema: { title: 'string', price: 'number', inStock: 'boolean' },
    responseSchema: { id: 'int', title: 'string' }
  }
];

// Nested schema
const NESTED_SCHEMA_APIS = [
  {
    id: 20,
    method: 'POST',
    path: '/orders',
    description: '建立訂單',
    requestSchema: {
      userId: 'int',
      address: {
        street: 'string',
        city: 'string',
        zip: 'string'
      },
      note: 'string'
    },
    responseSchema: {
      orderId: 'int',
      status: 'string'
    }
  }
];

// 各種型別測試
const ALL_TYPES_APIS = [
  {
    id: 30,
    method: 'POST',
    path: '/items',
    description: '所有型別測試',
    requestSchema: {
      name: 'string',
      count: 'int',
      price: 'number',
      active: 'boolean',
      tags: 'array'
    },
    responseSchema: {
      id: 'int',
      name: 'string',
      price: 'number',
      active: 'boolean',
      tags: 'array'
    }
  }
];

// 空 schema
const EMPTY_SCHEMA_APIS = [
  {
    id: 40,
    method: 'GET',
    path: '/health',
    description: '健康檢查',
    requestSchema: {},
    responseSchema: {}
  }
];

// PATCH 測試
const PATCH_APIS = [
  {
    id: 50,
    method: 'PATCH',
    path: '/users/:id',
    description: '部分更新',
    requestSchema: { name: 'string' },
    responseSchema: { id: 'int', name: 'string' }
  }
];

module.exports = {
  BASIC_APIS,
  MULTI_RESOURCE_APIS,
  NESTED_SCHEMA_APIS,
  ALL_TYPES_APIS,
  EMPTY_SCHEMA_APIS,
  PATCH_APIS
};
