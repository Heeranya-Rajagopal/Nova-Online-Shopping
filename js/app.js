
$(document).ready(function () {

    // Navigation bar
    $("#main-header").html(`
        <nav class="navbar">
            <a href="#" class="logo">NOVA<span>.</span></a>

            <div class="nav-links">
                <a href="#">Home</a>
                <a href="#collections">Collections</a>
                <a href="#products">Shop</a>
                <a href="#about">About</a>
            </div>

            <div class="nav-actions">
                <button class="nav-icon" title="Search">⌕</button>
                <button class="nav-icon" title="Shopping bag">♧</button>
                <a href="#" class="login-btn">Sign In ↗</a>
            </div>
        </nav>
    `);

    // Hero section
    $("#app").html(`
        <section class="hero">

            <div class="hero-content">
                <span class="eyebrow">
                    ✦ A DIFFERENT WAY TO DISCOVER
                </span>

                <h1>
                    Find your<br>
                    next <span>favourite.</span>
                </h1>

                <p>
                    Thoughtfully selected products.
                    Extraordinary everyday experiences.
                    Discover something that feels like you.
                </p>

                <div class="hero-buttons">
                    <a href="#collections" class="primary-btn">
                        Explore Collection ↗
                    </a>

                    <a href="#about" class="secondary-btn">
                        Our Story
                    </a>
                </div>

                <div class="hero-note">
                    <span>✦</span>
                    YOUR WORLD. YOUR DISCOVERY.
                </div>
            </div>

            <div class="hero-image">
                <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000"
                    alt="Curated fashion collection"
                >

                <div class="image-label">
                    <span>01 / DISCOVER</span>
                    <strong>Everyday, elevated.</strong>
                </div>
            </div>

            <div class="hero-number">01</div>

        </section>


        <!-- COLLECTIONS SECTION -->
        <section class="collections" id="collections">

            <div class="section-heading">
                <div>
                    <span class="eyebrow">✦ EXPLORE OUR WORLD</span>
                    <h2>Curated for <span>you.</span></h2>
                </div>

                <p>Discover pieces that bring a little
                something special to your everyday.</p>
            </div>

            <div class="collection-grid">

                <div class="collection-card">
                    <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900"
                         alt="Fashion collection">
                    <div class="collection-info">
                        <span>01 / STYLE</span>
                        <h3>The Everyday Edit</h3>
                        <a href="#products">Explore Collection ↗</a>
                    </div>
                </div>

                <div class="collection-card">
                    <img src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900"
                         alt="Accessories collection">
                    <div class="collection-info">
                        <span>02 / DETAILS</span>
                        <h3>Little Luxuries</h3>
                        <a href="#products">Explore Collection ↗</a>
                    </div>
                </div>

                <div class="collection-card">
                    <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900"
                         alt="Home collection">
                    <div class="collection-info">
                        <span>03 / LIVING</span>
                        <h3>Spaces & Stories</h3>
                        <a href="#products">Explore Collection ↗</a>
                    </div>
                </div>

            </div>
        </section>



        <!-- FEATURED PRODUCTS SECTION -->
        <section class="products-section" id="products">

            <div class="products-heading">
                <div>
                    <span class="eyebrow">✦ THE NOVA SELECTION</span>
                    <h2>Things you'll <span>love.</span></h2>
                    <p>A little inspiration for your everyday.</p>
                </div>

                <a href="#products" class="view-all">VIEW ALL PRODUCTS ↗</a>
            </div>

            <div class="product-filters">
                <button class="filter-btn active" data-category="all">All</button>
                <button class="filter-btn" data-category="fashion">Fashion</button>
                <button class="filter-btn" data-category="accessories">Accessories</button>
                <button class="filter-btn" data-category="living">Living</button>
            </div>

            <div class="product-grid">

                <div class="product-card" data-category="fashion">
                    <div class="product-image">
                        <span class="product-tag">BESTSELLER</span>
                        <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700"
                             alt="Elegant fashion dress">
                        <button class="add-cart-btn">ADD TO BAG +</button>
                    </div>
                    <div class="product-details">
                        <span>FASHION</span>
                        <h3>Everyday Elegance Dress</h3>
                        <p>₹1,899</p>
                    </div>
                </div>

                <div class="product-card" data-category="accessories">
                    <div class="product-image">
                        <span class="product-tag">NEW ARRIVAL</span>
                        <img src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700"
                             alt="Elegant gold jewellery">
                        <button class="add-cart-btn">ADD TO BAG +</button>
                    </div>
                    <div class="product-details">
                        <span>ACCESSORIES</span>
                        <h3>Golden Hour Necklace</h3>
                        <p>₹899</p>
                    </div>
                </div>

                <div class="product-card" data-category="living">
                    <div class="product-image">
                        <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700"
                             alt="Minimal home decor">
                        <button class="add-cart-btn">ADD TO BAG +</button>
                    </div>
                    <div class="product-details">
                        <span>LIVING</span>
                        <h3>Calm Space Decor</h3>
                        <p>₹2,499</p>
                    </div>
                </div>

                <div class="product-card" data-category="fashion">
                    <div class="product-image">
                        <span class="product-tag">POPULAR</span>
                        <img src="https://images.unsplash.com/photo-1544441893-675973e31985?w=700"
                             alt="Stylish clothing">
                        <button class="add-cart-btn">ADD TO BAG +</button>
                    </div>
                    <div class="product-details">
                        <span>FASHION</span>
                        <h3>The Weekend Essential</h3>
                        <p>₹1,499</p>
                    </div>
                </div>

            </div>
        </section>


    `);

    // PRODUCT CATEGORY FILTER
    $(".filter-btn").click(function () {

        let selectedCategory = $(this).data("category");

        $(".filter-btn").removeClass("active");
        $(this).addClass("active");

        $(".product-card").each(function () {

            let productCategory = $(this).data("category");

            if (selectedCategory === "all" ||
                selectedCategory === productCategory) {

                $(this).stop(true, true).fadeIn(300);

            } else {

                $(this).stop(true, true).fadeOut(200);

            }

        });

    });


    // Footer
    $("#main-footer").html(`
        <footer class="footer">
            <span>NOVA. © 2026</span>
            <span>MADE FOR THE CURIOUS.</span>
            <span>DISCOVER MORE ↗</span>
        </footer>
    `);

});
