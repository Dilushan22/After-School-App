new Vue({ //vue js instance
    el: '#app', //tells vue that element controlled using this #app
    data: {
        logo: "images/logo.jpg",
        sitename: "London Tendrils International School",
        sortOption: 'Subject',
        sortOrder: 'asc',
        searchQuery: '',
        showDropdown: false,

        products: [],
        order: {
            firstName: '',
            lastName: '',
            address: '',
            city: '',
            zip: '',
            state: '',
            gift: false,
            method: 'Home',
            Number: ''
        },
        states: {
            DU: 'Dubai',
            SH: 'Sharjah',
            AJ: 'Ajman',
            AB: 'Abu Dhabi'
        },
        // products: products,
        showProducts: true,
        cart: [],//array to store items in shopping cart
    },

     //created lifecyle hook 
    created: function(){ // this function will be run automatically
        // when creating the Vue instance
        fetch("http://localhost:3000/collection/Products")
                .then(response => response.json())
                .then(data => {
                  this.products = data;
                })
                .catch(error => {
                  console.error("Error fetching products:", error);
                  alert("Failed to load products.");
        });
      },

    methods: {

        addToCart(product) {
            // Check if adding to cart is possible
            if (this.canAddToCart(product)) {
                this.cart.push(product);
                product.Availability -= 1; // Decrease availability locally
                // Optionally, update product availability in the database
                fetch(`http://localhost:3000/collection/products/${product.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        Availability: product.Availability
                    })
                })
                .catch(error => {
                    console.error('Error updating product availability:', error);
                    alert('Failed to update product availability.');
                });
            }
        },

         

        canAddToCart(product) {
            return product.Availability > 0; // Allow adding to the cart if availability is greater than 0
        },

        availabilityMessage(availability) {
            if (availability === 4) {
                return '4 left';
            } else if (availability === 3) {
                return '3 left';
            } else if (availability === 2) {
                return '2 left';
            } else if (availability === 1) {
                return '1 left';
            } else {
                return 'No stock';
            }
        },

        cartCount(id) {
            return this.cart.filter(item => item.id === id).length;
        },

        toggleCheckout() {
            this.showProducts = !this.showProducts; // visiblizeof product list and checkout page
        },

        goHome() {
            this.showProducts = true; //shows product if true, visible screen
        },


        submitOrder() {
            // Prepare order data
            const orderData = {
                firstName: this.order.firstName,
                lastName: this.order.lastName,
                address: this.order.address,
                city: this.order.city,
                zip: this.order.zip,
                state: this.order.state,
                gift: this.order.gift,
                method: this.order.method,
                Number: this.order.Number,
                products: this.cart.map(product => ({
                    id: product.id,
                    Subject: product.Subject,
                    Price: product.Price,
                    Availability: product.Availability
                }))
                
            };
        

// Send the order to the back-end server
        fetch("http://localhost:3000/collection/orders", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Order submitted successfully!');


// Update product availability in the database
        const updatePromises = this.cart.map(product => {
            return fetch(`http://localhost:3000/collection/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Availability: product.Availability - 1 // Decrease availability
                })
            })
            .then(response => response.json())
            .catch(error => {
                console.error('Error updating product availability:', error);
            });
        });

                 // Wait for all updates to complete
                    Promise.all(updatePromises).then(() => {
                    console.log('All product availability updated');
                    this.cart = []; // Clear the cart after successful update
        });
        })
            .catch(error => {
                console.error('Error submitting order:', error);
                alert('Failed to submit order.');
        });

    },

        sortedProducts() {
            return this.products.slice().sort((a, b) => {
                let modifier = this.sortOrder === 'asc' ? 1 : -1;
                if (this.sortOption === 'Price' || this.sortOption === 'Availability') {
                    // For numeric sorting
                    return (a[this.sortOption] - b[this.sortOption]) * modifier;
                    } else if (this.sortOption === 'Subject') {
                    // alphabet sorting
                    return a.Subject.localeCompare(b.Subject) * modifier;
                    } else {
                    // string
                    let propA = String(a[this.sortOption]).toLowerCase();
                    let propB = String(b[this.sortOption]).toLowerCase();

                    return propA > propB ? modifier : -modifier;
                    }
            });
        },

        toggleSortOrder() {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        },

        
        removeFromCart(item) {
            const index = this.cart.findIndex(cartItem => cartItem.id === item.id);
      if (index !== -1) {
        this.cart.splice(index, 1);
        item.Availability += 1;

        fetch(`http://localhost:3000/collection/products/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Availability: item.Availability
          })
        }).catch(error => {
          console.error('Error updating product availability:', error);
          alert('Failed to update product availability.');
        });
      }
        },

        hideDropdownWithDelay() {
            // Hide the dropdown with a delay to allow selecting an item before it disappears
            setTimeout(() => {
                this.showDropdown = false;
            }, 200);
        },

        selectFromDropdown(selectedItem) {
             // Set the search query to the selected item and hide dropdown.
            this.searchQuery = selectedItem;
            this.showDropdown = false;
        },

        highlightItem(product) {
        this.selectedItem = product.Subject;  // Highlight the hovered item
        },


        updateProductAvailability(productId, availability) {
            // Update the availability of the product after order submission
            fetch(`http://localhost:3000/collection/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Availability: availability - 1 // Decrease availability after the order is placed
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Product availability updated');
            })
            .catch(error => {
                console.error('Error updating product availability:', error);
            });
        },

        deleteProduct(productId) {
            fetch(`http://localhost:3000/collection/products/${productId}`, {
                method: 'DELETE', // HTTP DELETE request
            })
            .then(response => response.json())
            .then(data => {
                alert('Product deleted successfully!');
                this.fetchProducts(); // Re-fetch products after deletion
            })
            .catch(error => {
                console.error('Error deleting product:', error);
            });
        }
   
    },

    computed: {
        cartItemCount() {// the propoerty name 
            // its value is calculated when it is called
            return this.cart.length || 0;
        },

        isCartEmpty() {
            return this.cart.length === 0;
        },

        itemsLeft(product) {
            return product.Availability - this.cartCount(product.id);
        },

        totalPrice() {
            return this.cart.reduce((total, item) => total + item.Price, 0);
        },

        filteredProducts() {//based on search query
            const query = this.searchQuery.toLowerCase();

            if (!query) {
                return this.sortedProducts(); 
            }

            const filtered = this.products.filter(product =>
                product.Subject.toLowerCase().includes(query)
            );

            const prioritized = filtered.sort((a, b) => {
                const aStartsWithQuery = a.Subject.toLowerCase().startsWith(query);
                const bStartsWithQuery = b.Subject.toLowerCase().startsWith(query);

                if (aStartsWithQuery === bStartsWithQuery) {
                    return a.Subject.localeCompare(b.Subject);
                }

                return aStartsWithQuery ? -1 : 1;
            });

            return prioritized;
        },

        formIsValid() {// Check if all fields are filled
            return (
                this.order.firstName.trim() &&
                this.order.lastName.trim() &&
                this.order.address.trim() &&
                this.order.city.trim() &&
                this.order.zip &&
                this.order.state &&
                this.order.Number.trim()
            );
        },
       
    }
    
});