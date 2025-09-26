const http = require('http');

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testInventoryAPI() {
  try {
    console.log('Testing inventory API...');

    // First login as employee
    console.log('1. Logging in as employee...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginResponse = await makeRequest(loginOptions, {
      email: 'modi.g@crmb.com',
      password: 'admin123'
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
    }

    const token = loginResponse.data.token;
    console.log('Login successful, token received');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test GET inventory
    console.log('2. Getting inventory list...');
    const getOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory',
      method: 'GET',
      headers: authHeaders
    };

    const getResponse = await makeRequest(getOptions);
    if (getResponse.status !== 200) {
      throw new Error(`GET inventory failed: ${JSON.stringify(getResponse.data)}`);
    }
    console.log(`Found ${getResponse.data.data.products.length} products`);

    // Test CREATE product
    console.log('3. Creating new product...');
    const newProduct = {
      name: 'Test Product',
      description: 'A test product for API testing',
      barcode: 'TEST123456',
      category: 'Test',
      price: 29.99,
      cost: 15.00,
      stock: 100,
      minStock: 10,
      maxStock: 200,
      expiryDate: '2025-12-31'
    };

    const createOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory',
      method: 'POST',
      headers: authHeaders
    };

    const createResponse = await makeRequest(createOptions, newProduct);
    if (createResponse.status !== 201) {
      throw new Error(`CREATE product failed: ${JSON.stringify(createResponse.data)}`);
    }
    console.log('Product created:', createResponse.data.data.product.name);

    const productId = createResponse.data.data.product._id;

    // Test UPDATE product
    console.log('4. Updating product...');
    const updateData = {
      price: 34.99,
      stock: 150
    };

    const updateOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/inventory/${productId}`,
      method: 'PUT',
      headers: authHeaders
    };

    const updateResponse = await makeRequest(updateOptions, updateData);
    if (updateResponse.status !== 200) {
      throw new Error(`UPDATE product failed: ${JSON.stringify(updateResponse.data)}`);
    }
    console.log('Product updated:', updateResponse.data.data.product.name);

    // Test barcode search
    console.log('5. Searching by barcode...');
    const searchOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory/search/barcode/TEST123456',
      method: 'GET',
      headers: authHeaders
    };

    const searchResponse = await makeRequest(searchOptions);
    if (searchResponse.status !== 200) {
      throw new Error(`Barcode search failed: ${JSON.stringify(searchResponse.data)}`);
    }
    console.log('Barcode search found:', searchResponse.data.data.product.name);

    // Test DELETE product
    console.log('6. Deleting product...');
    const deleteOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/inventory/${productId}`,
      method: 'DELETE',
      headers: authHeaders
    };

    const deleteResponse = await makeRequest(deleteOptions);
    if (deleteResponse.status !== 200) {
      throw new Error(`DELETE product failed: ${JSON.stringify(deleteResponse.data)}`);
    }
    console.log('Product deleted successfully');

    console.log('All CRUD operations completed successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testInventoryAPI();