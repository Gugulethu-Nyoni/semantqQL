# semantqQL
CRUD Abstraction for Semantq Full Stack Apps (semantqQL)

A super lightweight, robust, and reusable JavaScript HTTP client class that abstracts standard **CRUD** (Create, Read, Update, Delete) operations with simple `fetch` API calls — designed to streamline REST API interactions in your full-stack SemantQL projects.


## Installation

Install via npm:

```bash
npm install @semantq/ql
````

Import it into your project:

```js
import smQL from '@semantq/ql';
```



## Usage

Create an instance with the endpoint URL, HTTP method, request body (if any), and optional configuration:

```js
const result = await new smQL(endpoint, method, body, options);
```

* **endpoint**: URL string of your API resource
* **method**: HTTP method string (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) — defaults to `GET`
* **body**: Request payload for methods like POST or PUT (default: `null`)
* **options**: Optional configuration object — supports:

  * `headers` — additional headers
  * `log` — boolean to enable/disable automatic console logging (default: `true`)



## Automatic Logging

By default, `semantQL.js` **automatically logs** success or failure messages to the console for every request, showing HTTP method, status, and response data.

You do **not** need to manually log responses in your application code unless you disable logs explicitly:

```js
await new smQL('http://localhost:3003/product/products', 'GET', null, { log: false });
```



## Returned Result Object

The promise resolves to an object containing:

```js
{
  status: number,       // HTTP status code
  ok: boolean,          // true if response.ok (status 2xx)
  data: any,            // Parsed JSON or plain text response body
  error?: string        // Error message if request failed
}
```

You can use this object directly without needing extra logging.



## Examples: Common CRUD Operations

### 1. **GET** — Fetch all products

```js
const data = await new smQL('http://localhost:3003/product/products');

//now you can do: console.log(data); 
```



### 2. **POST** — Create a new category

```js
const newCategory = { name: 'Mobiles' };

const response = await new smQL('http://localhost:3003/category/categories', 'POST', newCategory);
```



### 3. **PUT** — Update an existing category

```js
const updatedCategory = { name: 'Mobile Phones' };
const categoryId = 7;

const response = await new smQL(`http://localhost:3003/category/categories/${categoryId}`, 'PUT', updatedCategory);
```



### 4. **DELETE** — Delete a product (without logs)

```js
const productId = 42;

const response = await new smQL(`http://localhost:3003/product/products/${productId}`, 'DELETE', null, { log: false });
```



## Why Use semantQL.js?

This class serves as a **simple CRUD abstraction layer** within the **full-stack SemantQL setup**, allowing you to:

* Write clean, concise API calls without repeating boilerplate
* Handle JSON payloads and errors uniformly
* Have automatic logging out-of-the-box with the option to disable per request
* Plug and play with any REST API endpoint

It’s lightweight and designed with developer experience in mind.


Happy CRUDing. !!!

## **License**

Semantq is open-source software licensed under the **MIT License**.

## Semantq Main Documentation: [Semantq](https://github.com/Gugulethu-Nyoni/semantq).