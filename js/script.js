// DOM Elements
const elements = {
    backToTop: document.getElementById('backToTop'),
    navbar: document.getElementById('mainNav'),
    sections: document.querySelectorAll('section'),
    gridItems: document.querySelectorAll('.grid-item'),
    heroSection: document.querySelector('.hero-section')
};

// Performance optimization
const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

// Enhanced Scroll Management
const scrollManager = {
    lastScroll: 0,

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
        elements.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    handleScroll: throttle(function() {
        // Back to top button
        if (window.scrollY > 300) {
            elements.backToTop.classList.add('visible');
        } else {
            elements.backToTop.classList.remove('visible');
        }

        // Navbar hide/show
        const currentScroll = window.pageYOffset;
        if (currentScroll > this.lastScroll && currentScroll > 100) {
            elements.navbar.classList.add('hidden');
        } else {
            elements.navbar.classList.remove('hidden');
        }
        this.lastScroll = currentScroll;

        this.parallaxEffect();
    }, 10),

    parallaxEffect() {
        if (elements.heroSection) {
            const scrolled = window.pageYOffset;
            elements.heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }
};

// Enhanced Intersection Observer
const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Add stagger effect to child elements
            const children = entry.target.querySelectorAll('.animate-stagger');
            children.forEach((child, index) => {
                setTimeout(() => {
                    child.classList.add('visible');
                }, index * 100);
            });
            
            observer.unobserve(entry.target);
        }
    });
};

const observerOptions = {
    threshold: 0.1,
    rootMargin: '-50px'
};

const observer = new IntersectionObserver(observerCallback, observerOptions);

// Scroll Animation Observer
const scrollAnimation = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    },
    {
        root: null,
        threshold: 0.1,
        rootMargin: '-50px'
    }
);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        const headerOffset = 76;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
            top: offsetPosition + window.pageYOffset,
            behavior: 'smooth'
        });
    });
});

// Initialize with enhanced features
document.addEventListener('DOMContentLoaded', () => {
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.style.display = 'none';

    scrollManager.init();
    elements.sections.forEach(section => observer.observe(section));
    
    // Add loading states
    elements.gridItems.forEach(item => {
        item.classList.add('loading');
        // Remove loading state after content loads
        setTimeout(() => item.classList.remove('loading'), 1000);
    });

    // Preload critical images
    const preloadImages = () => {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.src = img.dataset.src;
            img.onload = () => img.classList.add('loaded');
        });
    };
    
    preloadImages();

    // Observe all grid items for scroll animation
    document.querySelectorAll('.grid-item').forEach(item => {
        scrollAnimation.observe(item);
    });

    // Swipe functionality for testimonials
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    const testimonials = document.querySelectorAll('.testimonial');
    let currentIndex = 0;

    const updateSlider = () => {
        testimonialsSlider.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    document.querySelector('.testimonials-nav .prev').addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : testimonials.length - 1;
        updateSlider();
    });

    document.querySelector('.testimonials-nav .next').addEventListener('click', () => {
        currentIndex = (currentIndex < testimonials.length - 1) ? currentIndex + 1 : 0;
        updateSlider();
    });

    // Show one game at a time
    const gameItems = document.querySelectorAll('.grid-item');
    let gameIndex = 0;

    const showNextGame = () => {
        if (gameIndex < gameItems.length) {
            gameItems[gameIndex].classList.add('show');
            gameIndex++;
        }
    };

    window.addEventListener('scroll', throttle(() => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const lastGamePosition = gameItems[gameIndex - 1]?.getBoundingClientRect().bottom + window.scrollY;

        if (scrollPosition > lastGamePosition) {
            showNextGame();
        }
    }, 200));

    // Initially show the first game
    showNextGame();
});

var TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

TxtType.prototype.tick = function() {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

    var that = this;
    var delta = 200 - Math.random() * 100;

    if (this.isDeleting) { delta /= 2; }

    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500;
    }

    setTimeout(function() {
        that.tick();
    }, delta);
};

window.onload = function() {
    var elements = document.getElementsByClassName('typewrite');
    for (var i=0; i<elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
            new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }
    // INJECT CSS
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #fff}";
    document.body.appendChild(css);
};