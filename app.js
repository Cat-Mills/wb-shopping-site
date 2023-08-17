import express from 'express';
import nunjucks from 'nunjucks';
import morgan from 'morgan';
import session from 'express-session';
import users from './users.json' assert { type: 'json' };
import stuffedAnimalData from './stuffed-animal-data.json' assert { type: 'json' };

const app = express();
const port = '8000';

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: false }));

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

function getAnimalDetails(animalId) { 
  return stuffedAnimalData[animalId];
} //?This line declares a function named `getAnimalDetails` that takes an `animalId` as a parameter and returns the details of a stuffed animal from the data source called `stuffedAnimalData`. This is used to retrieve details about a specific stuffed animal by passing its corresponding `animalId` as an argument.


app.get('/', (req, res) => { //?Sets up a route handler for the HTTP GET request to the root URL ('/'), which is the main landing page of the web application.
  res.render('index.html'); //?This line uses the `res.render()` method to render a template named 'index.html'. 
});


app.get('/all-animals', (req, res) => { //?Sets up a route handler for the HTTP GET request to the '/all-animals' endpoint. When accessed by a user, the following code will be executed.
  res.render('all-animals.html.njk', { animals: Object.values(stuffedAnimalData) }); //? renders a template named 'all-animals.html.njk'. It also passes an object with a property named `animals` that contains an array of stuffed animal data.
});
//? { animals: Object.values(stuffedAnimalData) }
//? This object defines the template variables. The `animals` property contains an array that is populated with the values of the `stuffedAnimalData` object. The `Object.values()` method is used to extract an array of the values from the `stuffedAnimalsData` object.


app.get('/animal-details/:animalId', (req, res) => { //? The `:animalId` is a route parameter, which means it can capture a value from the URL.
  const animalDetails = getAnimalDetails(req.params.animalId) //? The `getAnimalDetails` function retrieves details of the stuffed animal based on the `animalId` parameter captured from the URL. It passes the `animalId` to the function to fetch the corresponding animal details.
  res.render('animal-details.html.njk', { animal: animalDetails }); //? This object defines the template variable. The `animal` property contains the details of the stuffed animal retrieved using the `getAnimalDetails` function.
});

app.get('/add-to-cart/:animalId', (req, res) => { //? The `:animalId` is a route parameter, which means it can capture a value from the URL.

  const {animalId} = req.params //? This line uses object destructuring to extract the `animalId` from the `req.params` object, which contains the route parameters. It assigns the extracted `animalId` to the `animalId` variable.

  if(!req.session.cart){ 
    req.session.cart = {} 
  } //? This block of code checks if the `cart` object exists in the session. If not, it initializes an empty object for the cart. The `req.session` is an object used to store session data.

  let {cart} = req.session //? This line uses object destructuring to assign the `cart` object from the `req.session` object to the `cart` variable.

  if(!cart[animalId]){
    cart[animalId] = 0
  } //? This block of code checks if the specified `animalId` exists as a key in the `cart` object. If not, it initializes the count of that item in the cart to 0.

  console.log(cart)

  cart[animalId] += 1 //? This line increments the count of the specified `animalId` in the cart by 1, indicating that one or more of that item has been added to the cart.

  res.redirect('/cart') //? After updating the cart, this line redirects the user to the '/cart' page to display the contents of their cart.
});

app.get('/cart', (req, res) => { //? This line sets up a route handler for the HTTP GET request to the '/cart' endpoint. When a user accesses the '/cart' page, the following code block will be executed.

  if(!req.session.cart){
    req.session.cart = {}
  } //? This block of code checks if the `cart` object exists in the session. If not, it initializes an empty object for the cart. the `req.session` object is used to store session data.

  let cart = req.session.cart //? This line assigns the `cart` object from the `req.session` object to the `cart` variable
  const cartItems = [] //? initializes an empty array `cartItems` to store the cart item details.
  let total = 0 //? initializes the `total` variable to keep track of the total cost of the items in the cart.

  for(const animalId in cart){ //? This loop iterates through each item in the `cart` object

    const animalDetails = getAnimalDetails(animalId) //? This line uses the `getAnimalDetails` function to retrieve details of a stuffed animal based on the `animalId` in the cart.

    const quantity = cart[animalId] //? This line retrieves the quantity of the stuffed animals stored in the cart.

    animalDetails.quantity = quantity

    const subtotal = quantity * animalDetails.price

    animalDetails.subtotal = subtotal

    total += subtotal

    cartItems.push(animalDetails)
  }

  res.render('cart.html.njk',{cartItems: cartItems, total: total})

});

app.get('/checkout', (req, res) => {
  // Empty the cart.
  req.session.cart = {};
  res.redirect('/all-animals');
});

app.get('/login', (req, res) => {
  res.render('login.html.njk');
});

app.post('/process-login', (req, res) => {
  for(const user of users){ //loops through each user object in array using the imported users.json file at the top of the page.
    if(req.body.username === user.username && req.body.password === user.password){ //Checks to see if the username and password match any in users object. Has to be req.body instead of req.query since it is an app.post, not an app.get
      req.session.username = user.username // Stores the username in the current session
      res.redirect('/all-animals') //Sends you to the animals page
      return //ends the loop
    }
  }
  res.render('login.html.njk', {message: 'Invalid username and password.'}) //passes message if the above statement is failed. (incorrect username and password.)
});

app.get('/logout', (req,res) => {
  req.session.destroy((err) =>{
    if(err){
      console.log(err)
    }
    res.redirect('/all-animals')
  })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}...`);
});
