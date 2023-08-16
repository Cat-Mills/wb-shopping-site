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
}

app.get('/', (req, res) => {
  res.render('index.html');
});

app.get('/all-animals', (req, res) => {
  res.render('all-animals.html.njk', { animals: Object.values(stuffedAnimalData) });
});

app.get('/animal-details/:animalId', (req, res) => {
  const animalDetails = getAnimalDetails(req.params.animalId)
  res.render('animal-details.html.njk', { animal: animalDetails });
});

app.get('/add-to-cart/:animalId', (req, res) => {
  // The logic here should be something like:
  // - check if a "cart" exists in the session, and create one (an empty
  // object keyed to the string "cart") if not
  const {animalId} = req.params
  if(!req.session.cart){
    req.session.cart = {}
  }
  let {cart} = req.session
  // - check if the desired animal id is in the cart, and if not, put it in
  if(!cart[animalId]){
    cart[animalId] = 0
  }
  // - increment the count for that animal id by 1
  console.log(cart)
  cart[animalId] += 1
  // - redirect the user to the cart page
  res.redirect('/cart')
});

app.get('/cart', (req, res) => {
  // - get the cart object from the session
  if(!req.session.cart){
    req.session.cart = {}
  }
  // - create an array to hold the animals in the cart, and a variable to hold the total cost of the order
  let cart = req.session.cart
    const cartItems = []
    let total = 0
  // - loop over the cart object, and for each animal id:
  //   - get the animal object by calling getAnimalDetails
  console.log(cart)
  for(const animalId in cart){
    console.log(animalId)
    const animalDetails = getAnimalDetails(animalId)
    const quantity = cart[animalId]
    animalDetails.quantity = quantity

    const subtotal = quantity * animalDetails.price
    animalDetails.subtotal = subtotal

    total += subtotal

    cartItems.push(animalDetails)
  }
  //   - compute the total cost for that type of animal
  //   - add this to the order total
  //   - add quantity and total cost as properties on the animal object
  //   - add the animal object to the array created above
  // - pass the total order cost and the array of animal objects to the template
  res.render('cart.html.njk',{cartItems: cartItems, total: total})
  // Make sure your function can also handle the case where no cart has
  // been added to the session
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
