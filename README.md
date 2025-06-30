using this code is easy , all you need is a mongodb compass running locally. 
run 
<pre> ```bash npm run dev ``` </pre>

this starts the server and installs all node dependency and starts the nodemon server that hot reloads upon change

🔐 Authentication APIs
Method	Endpoint	Description	Auth Required
POST	/api/auth/register	Register a new user	❌
POST	/api/auth/login	Log in and get JWT	❌

💳 Transaction APIs
Method	Endpoint	Description	Auth Required
GET	/api/transactions	Get all transactions (with filters)	✅
GET	/api/transactions/:id	Get a single transaction by ID	✅
POST	/api/transactions	Create a new transaction	✅
PUT	/api/transactions/:id	Update a transaction	✅
DELETE	/api/transactions/:id	Delete a transaction	✅

📊 Dashboard Summary API
Method	Endpoint	Description	Auth Required
GET	/api/summary	Get account balance, monthly income & expenses	✅ (uses query params like month, year)
