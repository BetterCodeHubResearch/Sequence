/*
 * Sequence
 *
 * The open-source CSS animation framework for creating responsive sliders,
 * presentations, banners, and other step-based applications.
 *
 * @link https://github.com/IanLunn/Sequence
 * @author IanLunn
 * @version 2.0.0-pre.1
 * @license https://github.com/IanLunn/Sequence/blob/master/LICENSE
 * @copyright Ian Lunn 2015
 */

function defineSequence() {

  'use strict';

  /**
   * Sequence function
   *
   * @param {Object} element - the element Sequence is bound to
   * @param {Object} options - this instance's options
   * @returns {Object} self - Properties and methods available to this instance
   * @api public
   */
  var Sequence = (function (element, options) {

    // Prevent an element from have multiple instances of Sequence applied to it
    if (element.getAttribute("data-seq-enabled") === "true") {
      return;
    }

    // The element now has Sequence attached to it
    element.setAttribute("data-seq-enabled", true);

    /* --- PRIVATE VARIABLES/FUNCTIONS --- */

    // Default Sequence settings
    var defaults = {

      /* --- General --- */

      // The first step to show
      startingStepId: 1,

      // Should the starting step animate in to begin with?
      startingStepAnimatesIn: false,

      // When the last step is reached, should Sequence cycle back to the start?
      cycle: true,

      // How long to wait between the current phase animating out, and the next
      // animating in.
      phaseThreshold: true,

      // Should animations be reversed when navigating backwards?
      reverseWhenNavigatingBackwards: true,

      // Should the active step be given a higher z-index?
      moveActiveStepToTop: true,

      // Does the theme need the browser to support 3D transforms? Sequence will
      // determine this automatically unless you change the following value to
      // true or false
      require3d: "auto",

      // is a transform-origin-z workaround required for Webkit based browsers?
      transformOriginWorkaround: true,


      /* --- Canvas Animation --- */

      // Should the canvas automatically animate between steps?
      animateCanvas: true,

      // Time it should take to animate between steps
      animateCanvasDuration: 500,


      /* --- autoPlay --- */

      // Cause Sequence to automatically navigate between steps
      autoPlay: true,

      // How long to wait between each step before navigation occurs again
      autoPlayThreshold: 5000,

      // Direction of navigation when autoPlay is enabled
      autoPlayDirection: 1,


      /* --- Navigation Skipping --- */

      // Allow the user to navigate between steps even if they haven't
      // finished animating
      navigationSkip: true,

      // How long to wait before the user is allowed to skip to another step
      navigationSkipThreshold: 250,

      // Fade a step when it has been skipped
      fadeStepWhenSkipped: true,

      // How long the fade should take
      fadeStepTime: 500,

      // Don't allow the user to go to a previous step when the current one is
      // still active
      preventReverseSkipping: false,


      /* --- Next/Prev Button --- */

      // Use next and previous buttons? You can also specify a CSS selector to
      // change what element acts as the button. If true, the element uses
      // classes of "seq-next" and "seq-prev"
      nextButton: true,
      prevButton: true,


      /* --- Pause Button --- */

      // Use a pause button? You can also specify a CSS selector to
      // change what element acts as the button. If true, the element uses the
      // class of "seq-pause"
      pauseButton: true,

      // Amount of time to wait until autoPlay starts again after being unpaused
      unpauseThreshold: null,

      // Pause autoPlay when the Sequence element is hovered over
      pauseOnHover: true,


      /* --- Pagination --- */

      // Use pagination? You can also specify a CSS selector to
      // change what element acts as pagination. If true, the element uses the
      // class of "seq-pagination"
      pagination: true,


      /* --- Preloader --- */

      // You can also specify a CSS selector to
      // change what element acts as the preloader. If true, the element uses
      // the class of "seq-preloader"
      preloader: false,

      // Preload all images from specific steps
      preloadTheseSteps: [1],

      // Preload specified images
      preloadTheseImages: [
        /**
         * Example usage
         * "images/catEatingSalad.jpg",
         * "images/grandmaDressedAsBatman.png"
         */
      ],

      // Hide Sequence's steps until it has preloaded
      hideStepsUntilPreloaded: true,


      /* --- Keyboard --- */

      // Can the user navigate between steps by pressing keyboard buttons?
      keyNavigation: false,

      // When numeric keys 1 - 9 are pressed, Sequence will navigate to the
      // corresponding step
      numericKeysGoToSteps: false,

      // Events to run when the user presses the left/right keys
      keyEvents: {
        left: function(sequence) {sequence.prev();},
        right: function(sequence) {sequence.next();}
      },


      /* --- Touch Swipe --- */

      // Can the user navigate between steps by swiping on a touch enabled device?
      swipeNavigation: true,

      // Events to run when the user swipes in a particular direction
      swipeEvents: {
        left: function(sequence) {sequence.next();},
        right: function(sequence) {sequence.prev();}
      },

      // Options to supply the third-party Hammer library See: http://hammerjs.github.io/recognizer-swipe/
      swipeHammerOptions: {},


      /* --- hashTags --- */

      // Should the URL update to include a hashTag that relates to the current
      // step being shown?
      hashTags: false,

      // Get the hashTag from an ID or data-seq-hashtag attribute?
      hashDataAttribute: false,

      // Should the hash change on the first step?
      hashChangesOnFirstStep: false,


      /* --- Fallback Theme --- */

      // Settings to use when the browser doesn't support CSS transitions
      fallback: {

        // The speed to transition between steps
        speed: 500
      }
    };

    // See sequence._animation.domDelay() for an explanation of this
    var domThreshold = 50;

    // Throttle the window resize event
    // see self.manageEvent.add.resizeThrottle()
    var resizeThreshold = 100;

    // Does the theme require full CSS 3D support?
    var requires3d = false;

    // Data attributes currently supported by Sequence
    var supportedDataAttributes = [
      "data-seq-x",
      "data-seq-y",
      "data-seq-z",
      "data-seq-rotate-x",
      "data-seq-rotate-y",
      "data-seq-rotate",
      "data-seq-scale"
    ];

    // Translate step data-attributes to a CSS property and unit
    var translateAttributes = {
      "seqX": {
        "name": "translateX",
        "unit": "px"
      },
      "seqY": {
        "name": "translateY",
        "unit": "px"
      },
      "seqZ": {
        "name": "translateZ",
        "unit": "px"
      },
      "seqRotateX": {
        "name": "rotateX",
        "unit": "deg"
      },
      "seqRotateY": {
        "name": "rotateY",
        "unit": "deg"
      },
      "seqRotate": {
        "name": "rotateZ",
        "unit": "deg"
      },
      "seqScale": {
        "name": "scale",
        "unit": ""
      }
    };

    /**
     *
     * This version of Modernizr is for use with Sequence.js and is included
     * internally to prevent conflicts with other Modernizr builds.
     *
     * Modernizr 2.8.2 (Custom Build) | MIT & BSD
     * Build: http://modernizr.com/download/#-cssanimations-csstransforms-csstransitions-svg-prefixed-teststyles-testprop-testallprops-prefixes-domprefixes
     */

     /* jshint ignore:start */
    var Modernizr=function(a,b,c){function z(a){i.cssText=a}function A(a,b){return z(l.join(a+";")+(b||""))}function B(a,b){return typeof a===b}function C(a,b){return!!~(""+a).indexOf(b)}function D(a,b){for(var d in a){var e=a[d];if(!C(e,"-")&&i[e]!==c)return b=="pfx"?e:!0}return!1}function E(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:B(f,"function")?f.bind(d||b):f}return!1}function F(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+n.join(d+" ")+d).split(" ");return B(b,"string")||B(b,"undefined")?D(e,b):(e=(a+" "+o.join(d+" ")+d).split(" "),E(e,b,c))}var d="2.8.2",e={},f=b.documentElement,g="modernizr",h=b.createElement(g),i=h.style,j,k={}.toString,l=" -webkit- -moz- -o- -ms- ".split(" "),m="Webkit Moz O ms",n=m.split(" "),o=m.toLowerCase().split(" "),p={svg:"http://www.w3.org/2000/svg"},q={},r={},s={},t=[],u=t.slice,v,w=function(a,c,d,e){var h,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:g+(d+1),l.appendChild(j);return h=["&#173;",'<style id="s',g,'">',a,"</style>"].join(""),l.id=g,(m?l:n).innerHTML+=h,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=f.style.overflow,f.style.overflow="hidden",f.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),f.style.overflow=k),!!i},x={}.hasOwnProperty,y;!B(x,"undefined")&&!B(x.call,"undefined")?y=function(a,b){return x.call(a,b)}:y=function(a,b){return b in a&&B(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=u.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(u.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(u.call(arguments)))};return e}),q.cssanimations=function(){return F("animationName")},q.csstransforms=function(){return!!F("transform")},q.csstransitions=function(){return F("transition")},q.svg=function(){return!!b.createElementNS&&!!b.createElementNS(p.svg,"svg").createSVGRect};for(var G in q)y(q,G)&&(v=G.toLowerCase(),e[v]=q[G](),t.push((e[v]?"":"no-")+v));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)y(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof enableClasses!="undefined"&&enableClasses&&(f.className+=" "+(b?"":"no-")+a),e[a]=b}return e},z(""),h=j=null,e._version=d,e._prefixes=l,e._domPrefixes=o,e._cssomPrefixes=n,e.testProp=function(a){return D([a])},e.testAllProps=F,e.testStyles=w,e.prefixed=function(a,b,c){return b?F(a,b,c):F(a,"pfx")},e}(this,window.document);
    /* jshint ignore:end */

    // Convert a prefixed transformOrigin to transform-origin
    var transformOrigin = Modernizr.prefixed("transformOrigin");
    if (transformOrigin !== false) {
      transformOrigin = transformOrigin.replace("mO", "m-o");
    }

    // Add indexOf() support to arrays for Internet Explorer 8
    if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function (searchElement, fromIndex) {
        if ( this === undefined || this === null ) {
          throw new TypeError( '"this" is null or not defined' );
        }

        // Hack to convert object.length to a UInt32
        var length = this.length >>> 0;

        fromIndex = +fromIndex || 0;

        if (Math.abs(fromIndex) === Infinity) {
          fromIndex = 0;
        }

        if (fromIndex < 0) {
          fromIndex += length;
          if (fromIndex < 0) {
            fromIndex = 0;
          }
        }

        for (;fromIndex < length; fromIndex++) {
          if (this[fromIndex] === searchElement) {
            return fromIndex;
          }
        }

        return -1;
      };
    }

    /**
     * Is an object an array?
     *
     * @param {Object} object - The object we want to test
     * @api private
     */
    function isArray(object) {

      if ( Object.prototype.toString.call( object ) === '[object Array]' ) {
        return true;
      }else {
        return false;
      }
    }

    /**
     * Extend object a with the properties of object b.
     * If there's a conflict, object b takes precedence.
     *
     * @param {Object} a - The first object to merge
     * @param {Object} b - The second object to merge (takes precedence)
     * @api private
     */
    function extend(a, b) {

      for (var i in b) {
        a[i] = b[i];
      }

      return a;
    }

    /**
     * Get the values of an element's CSS property
     *
     * @param {HTMLObject} element - The element to get the value from
     * @param {String} property - The CSS property to get the value of
     * @returns {String} value - The value from the element's CSS property
     */
    function getStyle(element, property) {

      var value;

      // IE
      if (element.currentStyle) {
        value = element.currentStyle[property];
      }

      else if (document.defaultView && document.defaultView.getComputedStyle) {
        value = document.defaultView.getComputedStyle(element, "")[property];
      }

      return value;
    }

    /**
     * Cross Browser helper for addEventListener
     *
     * @param {HTMLObject} element - The element to attach the event to
     * @param {String} eventName - The name of the event; "click" for example
     * @param {Function} handler - The function to execute when the event occurs
     * @returns {Function} handler - Returns the handler so it can be removed
     */
    function addEvent(element, eventName, handler) {

      if (element.addEventListener) {
        element.addEventListener(eventName, handler, false);

        return handler;
      }

      else if (element.attachEvent) {

        // Allows IE to return this keyword
        var handlerr = function() {
          handler.call(element);
        };

        element.attachEvent("on" + eventName, handlerr);

        return handlerr;
      }

    }

    /**
     * Cross Browser helper for removeEventListener
     *
     * @param {HTMLObject} element - The element to attach the event to
     * @param {String} eventName - The name of the event; "click" for example
     * @param {Function} handler - The function to execute when the event occurs
     */
    function removeEvent(element, eventName, handler) {

      if (element.addEventListener) {
        element.removeEventListener(eventName, handler, false);
      }

      else if (element.detachEvent) {
        element.detachEvent("on" + eventName, handler);
      }
    }

    /**
     * Converts a time value taken from a CSS property, such as "0.5s"
     * and converts it to a number in milliseconds, such as 500
     *
     * @param {String} time - the time in a string
     * @returns {Number} convertedTime - the time as a number
     * @api private
     */
    function convertTimeToMs(time) {

      var convertedTime,
          fraction;

      // Deal with milliseconds and seconds
      if (time.indexOf("ms") > -1) {
        fraction = 1;
      }else {
        fraction = 1000;
      }

      if (time == "0s") {
        convertedTime = 0;
      }else {
        convertedTime = parseFloat(time.replace("s", "")) * fraction;
      }

      return convertedTime;
    }

    /**
     * Does an element have a particular class?
     *
     * @param {HTMLElement} element - The element to check
     * @param {String} name - The name of the class to check for
     * @returns {Boolean}
     * @api private
     */
    function hasClass(element, name) {

      if (element === undefined) {
        return;
      }

      return new RegExp('(\\s|^)' + name + '(\\s|$)').test(element.className);
    }

    /**
     * Add a class to an element
     *
     * @param {Object} elements - The element(s) to add a class to
     * @param {String} name - The class to add
     * @api private
     */
    function addClass(elements, name) {

      var element,
          elementsLength,
          i;

      // If only one element is defined, turn it into a nodelist so it'll pass
      // through the for loop
      if (isArray(elements) === false) {
        elementsLength = 1;
        elements = [elements];
      }

      elementsLength = elements.length;

      for (i = 0; i < elementsLength; i++) {

        element = elements[i];

        if (hasClass(element, name) === false) {
          element.className += (element.className ? ' ': '') + name;
        }
      }
    }

    /**
     * Remove a class from an element
     *
     * @param {Object} elements - The element to remove a class from
     * @param {String} name - The class to remove
     * @api private
     */
    function removeClass(elements, name) {

      var element,
          elementsLength,
          i;

      // If only one element is defined, turn it into a nodelist so it'll pass
      // through the for loop
      if (isArray(elements) === false) {
        elementsLength = 1;
        elements = [elements];
      }

      else {
        elementsLength = elements.length;
      }

      for (i = 0; i < elementsLength; i++) {

        element = elements[i];

        if (hasClass(element, name) === true) {
          element.className = element.className.replace(new RegExp('(\\s|^)' + name + '(\\s|$)'),' ').replace(/^\s+|\s+$/g, '');
        }
      }
    }

    /**
     * Remove the no-JS "animate-in" class from a step
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api private
     */
    function removeNoJsClass(self) {

      if (self.isFallbackMode === true) {
        return;
      }

      // Look for the step with the "animate-in" class and remove the class
      for (var i = 0; i < self.steps.length; i++) {
        var element = self.steps[i];

        if (hasClass(element, "animate-in") === true) {
          var step = i + 1;

          self._animation.resetInheritedSpeed(step, "animate-in");
          removeClass(element, "animate-in");
        }
      }
    }

    /**
     * Convert an attribute to camel case
     *
     * @param {String} attribute - The attribute to convert
     * @api private
     */
    function attributeToCamelCase(attribute) {

      return attribute.replace("data-", "").replace(/\W+(.)/g, function (x, chr) {
        return chr.toUpperCase();
      });
    }

    /**
     * Cross browser helper to get data attributes from an element and return
     * them in an object.
     *
     * @param {HTMLElement} element - The element to get the attributes from
     * @param {Array} attributes - The attributes to test for
     * @returns {Object} dataAttributes - The attributes retrieved from the
     * element
     * @api private
     */
    function getDataAttributes(element, attributes) {

      var attribute,
          attributeCamelCase,
          attributeValue,
          attributesLength = attributes.length,
          i,
          dataAttributes = {};

      // TODO: Get attributes and filter via .dataset in supporting browsers

      for (i = 0; i < attributesLength; i++) {

        attribute = attributes[i];
        attributeCamelCase = attributeToCamelCase(attribute);
        attributeValue = element.getAttribute(attribute);

        if (attributeValue !== null) {
          dataAttributes[attributeCamelCase] = attributeValue;
        }
      }

      return dataAttributes;
    }

    /**
     * Does a theme require full CSS 3D support? This will return true when the
     * canvas is given one of the following data attributes:
     *
     * - data-seq-z
     * - data-seq-rotate-x
     * - data-seq-rotate-y
     *
     * @param {Object} dataAttributes - The data attributes applied to each step
     * @returns {Boolean} requires3d - Whether 3D is required
     * @api private
     */
    function is3dRequired(dataAttributes) {

      for (var step in dataAttributes) {

        var stepAttributes = dataAttributes[step];

        if (
          requires3d === false && (stepAttributes.hasOwnProperty("seqZ") === true || stepAttributes.hasOwnProperty("seqRotateX") === true || stepAttributes.hasOwnProperty("seqRotateY") === true)) {
          return true;
        }
      }

      return false;
    }

    /**
     * Determine if an element has a specified parent, and if so, return the
     * index number for the element.
     *
     * The index is taken from the top level elements witint a pagination
     * element. This function will iterate through each parent until it
     * reaches the top level, then get all top level elements and determine
     * the index of the chosen top level.
     *
     * @param {Object} parents - The parent element(s) that the child should be
     * within
     * @param {Object} target - The child element to test if it has the parent
     * @param {Object} previousTarget - The element that was previously checked
     * to determine if it was top level
     * @api private
     */
    function hasParent(parent, target, previousTarget) {

      if (target.nodeName === "BODY") {
        return false;
      }

      // We're at the pagination parent
      if (parent === target) {

        if (previousTarget !== undefined) {

          // Get the top level element clicked and all top level elements
          var topLevel = previousTarget;
          var allTopLevel = parent.getElementsByTagName(topLevel.nodeName);

          // Count the number of top level elements
          var i = allTopLevel.length;

          // Which top level element was clicked?
          while (i--) {
            if (topLevel === allTopLevel[i]) {

              // One-base the index and return it
              return i + 1;
            }
          }
        }
      }

      // Not yet at the pagination parent element, iterate again
      else {
        previousTarget = target;
        return hasParent(parent, target.parentNode, previousTarget);
      }
    }

    /**
     * Get Sequence's steps
     *
     * @param {HTMLElement} parent - The parent element of the steps
     * @returns {Array} steps - The elements that make up Sequence's steps
     * @api private
     */
    function getSteps(parent) {

      var steps = [],
          element,
          elements = parent.getElementsByTagName("*"),
          elementsLength = elements.length,
          i;

      // Get the elements that have a parent with a class of "seq-canvas"
      for (i = 0; i < elementsLength; i++) {

        element = elements[i];
        parent = element.parentNode;

        if (hasClass(parent, "seq-canvas") === true) {
          steps.push(element);
        }
      }

      return steps;
    }

    /**
     * Take transform properties and convert them into a CSS string
     *
     * @param {Object} properties - The transform properties to convert to a
     * string
     * @param {Boolean} polar - Whether the rotate X/Y/Z properties should be
     * reversed
     * @returns {String} The transform properties in a CSS string
     * @api private
     */
    function propertiesToCss(properties, polar) {

      var css = "",
          value,
          property,
          propertyName,
          unit;

      css += "translateX(" + properties.seqX + "px) ";
      css += "translateY(" + properties.seqY + "px) ";
      css += "translateZ(" + properties.seqZ + "px) ";

      // Add rotate X/Y/Z and reverse them if necessary
      if (polar !== true) {

        css += "rotateX(" + properties.seqRotateX + "deg) ";
        css += "rotateY(" + properties.seqRotateY + "deg) ";
        css += "rotateZ(" + properties.seqRotate + "deg) ";
        css += "scale(" + properties.seqScale + ")";
      } else {

        css += "rotateZ(" + properties.seqRotate + "deg) ";
        css += "rotateY(" + properties.seqRotateY + "deg) ";
        css += "rotateX(" + properties.seqRotateX + "deg) ";
      }

      return css;
    }

    /* --- PUBLIC PROPERTIES/METHODS --- */

    var self = {};

    /**
     * Manage UI elements such as nextButton, prevButton, and pagination
     *
     * @api private
     */
    self._ui = {

      // Default UI elements
      defaultElements: {
        "nextButton" : "seq-next",
        "prevButton" : "seq-prev",
        "pauseButton": "seq-pause",
        "pagination" : "seq-pagination",
        "preloader"  : "seq-preloader"
      },

      /**
       * Get an UI element
       *
       * @param {String} type - The type of UI element (nextButton for example)
       * @returns {Boolean | HTMLElement} option - True if using the default
       * element, else an HTMLElement
       */
      getElements: function(type, option) {

        var element,
            elements,
            elementsLength,
            relatedElements = [],
            rel,
            i;

        // Get the element being used
        if (option === true) {

          // Default elements
          elements = document.querySelectorAll("." + this.defaultElements[type]);
        } else {

          // Custom elements
          elements = document.querySelectorAll(option);
        }

        elementsLength = elements.length;

        // Does the element control this instance of Sequence? We're looking
        // for either a global element or one with a rel attribute the same
        // as this instances ID
        for (i = 0; i < elementsLength; i++) {

          element = elements[i];
          rel = element.getAttribute("rel");

          if (rel === null || rel === self.container.getAttribute("id")) {
            relatedElements.push(element);
          }
        }

        return relatedElements;
      },

      /**
       * Fade an element in using transitions if they're supported, else use JS
       *
       * @param {HTMLElement} element - The element to show
       * @param {Number} duration - The duration to show the element over
       */
      show: function(element, duration) {

        if (self.transitionsSupported === true) {

          element.style[Modernizr.prefixed("transitionDuration")] = duration + "ms";
          element.style[Modernizr.prefixed("transitionProperty")] = "opacity, " + Modernizr.prefixed("transform");
          element.style.opacity = 1;
        }

        else {

         self._animationFallback.animate(element, "opacity", "", 0, 1, duration);
        }
      },

      /**
       * Fade an element out using transitions if they're supported, else use JS
       *
       * @param {HTMLElement} element - The element to hide
       * @param {Number} duration - The duration to hide the element over
       * @param {Function} callback - Function to execute when the element is
       * hidden
       */
      hide: function(element, duration, callback) {

        if (self.transitionsSupported === true) {

          element.style[Modernizr.prefixed("transitionDuration")] = duration + "ms";
          element.style[Modernizr.prefixed("transitionProperty")] = "opacity, " + Modernizr.prefixed("transform");
          element.style.opacity = 0;
        }

        else {

         self._animationFallback.animate(element, "opacity", "", 1, 0, duration);
        }

        if (callback !== undefined) {
          setTimeout(function() {
            callback();
          }, duration);
        }
      }
    };

    /**
     * Methods relating to autoPlay
     *
     * @api private
     */
    self._autoPlay = {

      /**
       * Start or restart autoPlay only if autoPlay is enabled and Sequence
       * isn't currently paused.
       */
      init: function() {

        self.isAutoPlayActive = false;

        // Should the unpause threshold be taken from the autoPlayThreshold or
        // has the developer defined an unpauseThreshold?
        self.options.unpauseThreshold = (self.options.unpauseThreshold === null) ? self.options.autoPlayThreshold : self.options.unpauseThreshold;

        // Start autoPlay
        if (self.options.autoPlay === true && self.isPaused === false) {
          this.start();
        }
      },

      /**
       * Unpause autoPlay
       */
      unpause: function() {

        if (self.options.autoPlay === true) {

          self.isPaused = false;

          this.start();

          removeClass(self.container, "seq-paused");
          removeClass(self.pauseButton, "seq-paused");

          // Callback
          self.unpaused(self);
        }
      },

      /**
       * Pause autoPlay
       */
      pause: function() {

        self.isPaused = true;

        this.stop();

        addClass(self.container, "seq-paused");
        addClass(self.pauseButton, "seq-paused");

        // Callback
        self.paused(self);
      },

      /**
       * Start autoPlay
       */
      start: function() {

        var threshold;

        // How long to wait before autoPlay should start?
        if (self.isPaused === false) {
          threshold = self.options.autoPlayThreshold;
        }else {
          threshold = self.options.unpauseThreshold;
        }

        // autoPlay is now active
        self.isAutoPlayActive = true;

        // Clear the previous autoPlayTimer
        clearTimeout(self.autoPlayTimer);

        // Choose the direction and start autoPlay
        self.autoPlayTimer = setTimeout(function() {

          if (self.options.autoPlayDirection === 1) {
            self.next();
          }else {
            self.prev();
          }
        }, threshold);
      },

      /**
       * Stop autoPlay
       */
      stop: function() {

        self.isAutoPlayActive = false;

        clearTimeout(self.autoPlayTimer);
      }
    };

    /**
     * Controls Sequence's canvas
     *
     * @api private
     */
    self._canvas = {

      /**
       * Get the canvas' transform-origin and the transform properties
       * converted into a CSS string
       *
       * @param {Number} id - The ID of the step's transform properties
       * @returns {Object} convertedTransforms
       */
      convertTransformsToCss: function(id) {

        var transformCss,
            transformScale,
            convertedTransforms,
            stepName = "step" + id;

        var origin = self.animationMap[stepName].transformOrigin,
            canvasTransformProperties = self.animationMap[stepName].canvasTransform;

        // Get the step's X and Y transform origins, then flip the X/Y/Z
        // values (positive to negative) and add them to the origins
        var originX = origin.x + (canvasTransformProperties.seqX * -1),
            originY = origin.y + (canvasTransformProperties.seqY * -1),
            originZ = origin.z + (canvasTransformProperties.seqZ * -1);

        // Turn the transform properties into a CSS string
        transformCss = propertiesToCss(canvasTransformProperties, true);

        convertedTransforms = {
          "origins": originX + "px " + originY + "px " + originZ + "px",
          "string": transformCss,
          "scale": canvasTransformProperties.seqScale
        };

        return convertedTransforms;
      },

      /**
       * Get transform properties from a steps data-attributes and return them
       * so the canvas and steps can be set up.
       *
       * @returns {String} transformCss - The CSS string containing transform
       * properties
       */
      getTransformProperties: function() {

        var i,
            step,
            stepName,
            dataAttributes = {};

        var stepTransform,
            canvasTransform,
            stepAttributes,
            index,
            attribute,
            attributeReversed,
            styles,
            property,
            transformOrigins,
            origins,
            originX = 0,
            originY = 0,
            originZ = 0;

        for (i = 0; i < self.noOfSteps; i++) {

          step = self.steps[i];
          stepName = "step" + (i + 1);

          // Add each step to the animation map, where we'll save its transform
          // properties
          self.animationMap[stepName] = {};
          self.animationMap[stepName].isAnimating = false;

          // Get this step's supported data attributes (data-seq-x for example)
          stepAttributes = getDataAttributes(step, supportedDataAttributes);
          dataAttributes[stepName] = stepAttributes;

          // Reset the step and canvas transforms back to default
          stepTransform = {
            "seqX": 0,
            "seqY": 0,
            "seqZ": 0,
            "seqRotateX": 0,
            "seqRotateY": 0,
            "seqRotate": 0,
            "seqScale": 1
          };

          canvasTransform = {
            "seqX": 0,
            "seqY": 0,
            "seqZ": 0,
            "seqRotateX": 0,
            "seqRotateY": 0,
            "seqRotate": 0,
            "seqScale": 1
          };

          // Set up the transform CSS for each data-attribute used
          for (property in stepAttributes) {

            if (stepAttributes.hasOwnProperty(property) === true) {

              attribute = stepAttributes[property];
              stepTransform[property] = parseInt(attribute);

              if (property !== "seqScale") {
                attributeReversed = attribute * -1;
              }else{
                attributeReversed = 1 / attribute;
              }

              canvasTransform[property] = attributeReversed;
            }
          }

          // Add the offset left/top onto the X/Y coordinates
          // (after making them polar)
          canvasTransform.seqX += step.offsetLeft * -1;
          canvasTransform.seqY += step.offsetTop * -1;

          // Get the transform origins
          transformOrigins = getStyle(step, [Modernizr.prefixed("transformOrigin")]);

          // Split the transform origins into X, Y, Z
          if (transformOrigins !== undefined) {

            origins = transformOrigins.split(" ");
            originX = parseFloat(origins[0]);
            originY = parseFloat(origins[1]);

            if (origins[2] !== undefined) {
              originZ = parseFloat(origins[2]);
            }
          }

          self.animationMap[stepName].transformOrigin = {
            "x": originX,
            "y": originY,
            "z": originZ
          };

          self.animationMap[stepName].stepTransform = stepTransform;
          self.animationMap[stepName].canvasTransform = canvasTransform;
        }

        return dataAttributes;
      },

      /**
       * Setup the canvas, screen, and steps ready to be animated
       */
      setup: function(id) {

        var stepName,
            stepElement,
            transformCss,
            i;

        // Add transform-style: preserve-3d to the screen and canvas
        self.screen.style.height = "100%";
        self.screen.style.width = "100%";

        if (self.requires3d === true) {
          self.screen.style[Modernizr.prefixed("transformStyle")] = "preserve-3d";
          self.canvas.style[Modernizr.prefixed("transformStyle")] = "preserve-3d";
        }

        // Apply the transform CSS for each step
        for (i = 0; i < self.noOfSteps; i++) {
          stepElement = self.steps[i];
          stepName = "step" + (i + 1);
          transformCss = propertiesToCss(self.animationMap[stepName].stepTransform);

          // Temporarily give the element a transition-duration of 0 so it
          // doesn't animate when we apply the transform properties
          stepElement.style[Modernizr.prefixed("transition")] = "0ms 0ms";

          // Add the transform properties
          stepElement.style[Modernizr.prefixed("transform")] = transformCss;

          // Now remove the temporary transition-duration
          self._animation.domDelay(function() {
            stepElement.style[Modernizr.prefixed("transition")] = "";
          });
        }
      },

      /**
       * Move the canvas to show a specific step
       *
       * @param {Number} id - The ID of the step to move to
       * @param {Boolean} animate - Should the canvas animate or snap?
       */
      move: function(id, animate) {

        if (self.options.animateCanvas === true) {

          // Get the canvas element and step element to animate to
          var canvas = self.canvas,
              duration = 0,
              transformCss;

          // Should the canvas animate?
          if (animate === true && self._firstRun === false) {
            duration = self.options.animateCanvasDuration;
          }

          // Animate the canvas using CSS transitions
          if (self.isFallbackMode === false) {

            // Get the transform properties translate X/Y/Z, rotate X/Y/Z,
            // scale, and transform-origin
            transformCss = this.convertTransformsToCss(id);

            // Apply the scale transform CSS to the screen
            self.screen.style[Modernizr.prefixed("transitionDuration")] = duration + "ms";
            self.screen.style[Modernizr.prefixed("transitionProperty")] = Modernizr.prefixed("transform");

            if (self.transformOriginSupported === true) {
              self.screen.style[Modernizr.prefixed("transform")] = "scale(" + transformCss.scale + ")";
            }

            // Workaround for Webkit bug
            else {
              self.screen.style[Modernizr.prefixed("transform")] = "translateZ(" + transformCss.origins.split(" ")[2] + ") scale(" + transformCss.scale + ")";
            }

            // Apply the translate/rotate transform CSS to the canvas
            canvas.style[Modernizr.prefixed("transitionDuration")] = duration + "ms";
            canvas.style[Modernizr.prefixed("transitionProperty")] = Modernizr.prefixed("transform") + ", " + transformOrigin;
            canvas.style[Modernizr.prefixed("transformOrigin")] = transformCss.origins;
            canvas.style[Modernizr.prefixed("transform")] = transformCss.string;
          }
        }
      }
    };

    /**
     * Controls Sequence's step animations
     *
     * @api private
     */
    self._animation = {

      /**
       * Get the properties of a phase
       *
       * @param {Number} stepId - The ID of the step
       * @returns {Object} ID and element of the step the phase belongs to,
       * array of all child elements that belong to step, array of animated
       * elements, timings object containing maxDuration, maxDelay, and
       * maxLength
       */
      getPhaseProperties: function(stepId) {

        var stepElement = self.steps[stepId - 1],
            stepAnimatedChildren = stepElement.querySelectorAll("*[data-seq]"),
            stepChildren = stepElement.querySelectorAll("*"),
            stepChildrenLength = stepChildren.length,
            el,
            i,
            watchedDurations = [],
            watchedDelays = [],
            watchedLengths = [],
            durations = [],
            delays = [],
            lengths = [],
            duration,
            delay;

        // Get the animation length of each element (duration + delay) and save
        // for comparisson
        for (i = 0; i < stepChildrenLength; i++) {
          el = stepChildren[i];

          duration = convertTimeToMs(getStyle(el, Modernizr.prefixed("transitionDuration")));
             delay = convertTimeToMs(getStyle(el, Modernizr.prefixed("transitionDelay")));

          // Save this elements animation length for all elements
          durations.push(duration);
          delays.push(delay);
          lengths.push(duration + delay);

          // Also save animation lengths but only for watched elements
          if (el.getAttribute("data-seq") !== null) {
            watchedDurations.push(duration);
            watchedDelays.push(delay);
            watchedLengths.push(duration + delay);
          }
        }

        // Which were the longest durations and delays?
        var maxDuration = Math.max.apply(Math, durations),
            maxDelay = Math.max.apply(Math, delays),
            maxTotal = maxDuration + maxDelay;

        var watchedMaxDuration = Math.max.apply(Math, watchedDurations),
            watchedMaxDelay = Math.max.apply(Math, watchedDelays),
            watchedMaxTotal = watchedMaxDuration + watchedMaxDelay;

        return {
          stepId: stepId,
          stepElement: stepElement,
          children: stepChildren,
          animatedChildren: stepAnimatedChildren,
          watchedTimings: {
            maxDuration: watchedMaxDuration,
            maxDelay: watchedMaxDelay,
            maxTotal: watchedMaxTotal
          },
          timings: {
            maxDuration: maxDuration,
            maxDelay: maxDelay,
            maxTotal: maxTotal
          }
        };
      },

      /**
       * If the moveActiveStepToTop option is being used, move the next step
       * to the top (via a z-index equivalent to the number of steps), and the
       * current step to the bottom
       *
       * @param {HTMLElement} currentElement - The current step to be moved off
       * the top
       * @param {HTMLElement} nextElement - The next step to be moved to the top
       */
      moveActiveStepToTop: function(currentElement, nextElement) {

        if (self.options.moveActiveStepToTop === true) {

          // var prevStepElement = self.animationMap["step" + self.prevStepId].element;
          var prevStepElement = self.steps[self.prevStepId - 1];

          prevStepElement.style.zIndex = 1;
          currentElement.style.zIndex = self.noOfSteps - 1;
          nextElement.style.zIndex = self.noOfSteps;
        }
      },

      /**
       * If the navigationSkipThreshold option is being used, prevent the use
       * of goTo() during the threshold period
       *
       * @param {Number} id - The ID of the step Sequence is trying to go to
       * @param {Number} direction - The direction Sequence is trying to go
       */
      manageNavigationSkip: function(id, direction) {

        if (self.isFallbackMode === true) {
          return;
        }

        var _animation = this,
            phases = self.animationMap.activePhases;

        // Show the next step again
        self._ui.show(phases.next.stepElement, 0);

        if (self.options.navigationSkip === true) {

          // Start the navigation skip threshold
          self.navigationSkipThresholdActive = true;

          // Count the number of steps currently animating
          var activeStepsLength = self.animationMap.stepsAnimating,
              i,
              step,
              stepProperties,
              stepElement;

          // Add the steps to the list of active steps
          self.animationMap["step" + phases.current.stepId].isAnimating = true;
          self.animationMap["step" + phases.next.stepId].isAnimating = true;

          if (self.options.startingStepAnimatesIn === true && self._firstRun === true) {
            self.animationMap.stepsAnimating += 1;
          } else {
            self.animationMap.stepsAnimating += 2;
          }


          // Are there steps currently animating that need to be faded out?
          if (activeStepsLength !== 0) {

            phases.current.skipped = true;

            // If a step is waiting to animate in based on the phaseThreshold,
            // cancel it
            clearTimeout(self.phaseThresholdTimer);

            // Fade a step out if the user navigates to another prior to its
            // animation finishing
            if (self.options.fadeStepWhenSkipped === true) {

              // Fade all elements that are animating
              // (not including the current one)
              for (i = 1; i <= self.noOfSteps; i++) {

                step = "step" + i;
                stepProperties = self.animationMap[step];

                if (stepProperties.isAnimating === true && i !== id) {
                  stepElement = self.steps[i - 1];

                  self._animation.stepSkipped(direction, step, stepElement);
                }
              }
            }
          }

          // Start the navigationSkipThreshold timer to prevent being able to
          // navigate too quickly
          setTimeout(function() {
            self.navigationSkipThresholdActive = false;
          }, self.options.navigationSkipThreshold);
        }
      },

      /**
       * Deal with a step when it has been skipped
       *
       * @param {Number} direction - The direction of navigation when the step
       * was skipped
       * @param {String} step - The step that was skipped
       * @param {HTMLElement} stepElement - The step element that was skipped
       */
      stepSkipped: function(direction, step, stepElement) {

        var phase = (direction === 1) ? "animate-out": "animate-in";

        // Fade the step out
        self._ui.hide(stepElement, self.options.fadeStepTime, function() {

          // Stop the skipped element from animating
          // TODO
        });
      },

      /**
       * Change a step's class. Example: go from step1 to step2
       *
       * @param {Number} id - The ID of the step to change
       */
      changeStep: function(id) {

        // Get the step to add
        var stepToAdd = "seq-step" + id;

        // Add the new step and remove the previous
        if (self.currentStepId !== undefined) {

          var stepToRemove = "seq-step" + self.currentStepId;

          addClass(self.container, stepToAdd);
          removeClass(self.container, stepToRemove);
        }else {
          addClass(self.container, stepToAdd);
        }
      },

      /**
       * Go forward to the next step
       *
       * @param {Number} id - The ID of the next step
       * @param {Object} activePhases - Properties relating to the active phases
       * (animate-in and animate-out)
       * @param {Number} phaseThresholdTime - The amount of time in milliseconds
       * before the next step should start animating in
       * @param {Boolean} hashTagNav - If navigation is triggered by the hashTag
       */
      forward: function(id, activePhases, phaseThresholdTime, hashTagNav) {

        var _animation = this;

        // Snap the step to the "animate-start" phase
        removeClass(activePhases.next.stepElement, "animate-out");

        _animation.domDelay(function() {
          // Make the current step transition to "animate-out"
          addClass(activePhases.current.stepElement, "animate-out");
          removeClass(activePhases.current.stepElement, "animate-in");

          // Make the next step transition to "animate-in"
          _animation.startAnimateIn(id, 1, activePhases, phaseThresholdTime, hashTagNav);
        });
      },

      /**
       * Go in reverse to the next step
       *
       * @param {Number} id - The ID of the next step
       * @param {Object} activePhases - Properties relating to the active phases
       * (animate-in and animate-out)
       * @param {Number} phaseThresholdTime - The amount of time in milliseconds
       * before the next step should start animating in
       * @param {Boolean} hashTagNav - If navigation is triggered by the hashTag
       */
      reverse: function(id, activePhases, phaseThresholdTime, hashTagNav) {

        var _animation = this,
            phaseDifference = 0,
            phaseThreshold = 0,
            currentDelay = 0,
            nextDelay = 0;

        // Snap the next phase to "animate-out"
        addClass(activePhases.next.stepElement, "animate-out");

        _animation.domDelay(function() {

          // Do we need to add a delay to account for one phase finishing
          // before another?
          if (self.options.phaseThreshold !== true) {

            phaseDifference = activePhases.current.timings.maxTotal - activePhases.next.timings.maxTotal;

            if (phaseDifference > 0) {
              nextDelay = phaseDifference;
            } else if (phaseDifference < 0) {
              currentDelay = Math.abs(phaseDifference);
            }
          }

          // Reverse properties for all elements
          _animation.reverseProperties(activePhases.current, currentDelay, 0);
          _animation.reverseProperties(activePhases.next, nextDelay, phaseThresholdTime);

          // Make the current step transition to "animate-start"
          removeClass(activePhases.current.stepElement, "animate-in");

          // Make the next step transition to "animate-in"
          _animation.startAnimateIn(id, -1, activePhases, phaseThresholdTime, hashTagNav);
        });
      },

      /**
       * Apply the reversed properties to all animatable elements within a phase
       *
       * @param {Object} activePhases - Properties relating to the active phases
       * (animate-in and animate-out)
       * @param {Number} phaseDelay - A delay that is added when one phase
       * animates longer than the other
       * @param {Number} phaseThresholdTime - The amount of time in milliseconds
       * before the next step should start animating in
       */
      reverseProperties: function(activePhase, phaseDelay, phaseThresholdTime) {

        var _animation = this,
            stepChildren = activePhase.stepElement.querySelectorAll("*"),
            stepChildrenLength = stepChildren.length,
            stepDurations = activePhase.timings,
            el,
            i,
            timingFunction,
            timingFunctionReversed,
            duration,
            delay,
            total,
            durations = [],
            delays = [],
            totals = [];

        for (i = 0; i < stepChildrenLength; i++) {
          el = stepChildren[i];

          // Get each element's duration and delay
          duration = convertTimeToMs(getStyle(el, Modernizr.prefixed("transitionDuration")));
          delay = convertTimeToMs(getStyle(el, Modernizr.prefixed("transitionDelay")));

          // Delay elements so they animate in relation to other elements in the phase
          delay = (stepDurations.maxDuration - duration) + (stepDurations.maxDelay - delay) + phaseDelay;

          // Save the total of the reversed animation
          durations.push(duration);
          delays.push(delay);
          totals.push(delay + duration);

          // Reverse the timing function
          timingFunction = getStyle(el, Modernizr.prefixed("transitionTimingFunction"));
          timingFunctionReversed = _animation.reverseTimingFunction(timingFunction);

          // Apply the reversed transition properties to each element
          el.style[Modernizr.prefixed("transition")] = duration + "ms " + delay + "ms " + timingFunctionReversed;
        }

        // Get the longest duration, delay, and total of the reversed animations
        activePhase.timings.maxDuration = Math.max.apply(Math, durations);
        activePhase.timings.maxDelay = Math.max.apply(Math, delays);
        total = Math.max.apply(Math, totals);
        activePhase.timings.maxTotal = total;

        // Add the phaseThreshold delay
        total = (total + phaseThresholdTime);

        // Remove the reversed transition properties from each element once it
        // has finished animating; allowing for the inherited styles to take
        // effect again.
        setTimeout(function() {
          _animation.domDelay(function() {
            for (i = 0; i < stepChildrenLength; i++) {
              el = stepChildren[i];

              el.style[Modernizr.prefixed("transition")] = "";
            }
          });
        }, total);
      },

      /**
       * Start the next step's "animate-in" phase
       *
       * @param {Number} id - The ID of the next step
       * @param {Number} direction - The direction of navigation
       * @param {Object} activePhases - Properties relating to the active phases
       * (animate-in and animate-out)
       * @param {Number} phaseThresholdTime - The amount of time in milliseconds
       * before the next step should start animating in
       * @param {Boolean} hashTagNav - If navigation is triggered by the hashTag
       */
      startAnimateIn: function(id, direction, activePhases, phaseThresholdTime, hashTagNav) {

        var _animation = this,
            stepDurations = {};

        // The next ID is now the current ID
        self.prevStepId = self.currentStepId;
        self.currentStepId = id;

        // When should the "animate-in" phase start and how long until the step
        // completely finishes animating?
        if (self._firstRun === false) {

          // If the current phase was skipped whilst animating, trigger the
          // currentPhaseEnded() callback now
          if (activePhases.current.skipped === true) {
            self.currentPhaseEnded();
          }

          // Callback
          self.animationStarted(id, self);
          _animation._currentPhaseStarted();

          // Determine the current and next phase durations, and the overall
          // step duration
          var currentPhaseDuration = activePhases.current.watchedTimings.maxTotal,
              nextPhaseDuration = activePhases.next.watchedTimings.maxTotal;
          stepDurations = _animation.getStepDurations(currentPhaseDuration, nextPhaseDuration, phaseThresholdTime);

          // Start the "animate-in" phase
          self.phaseThresholdTimer = setTimeout(function() {

            _animation._nextPhaseStarted(hashTagNav);
            addClass(activePhases.next.stepElement, "animate-in");
            removeClass(activePhases.next.stepElement, "animate-out");
          }, phaseThresholdTime);

          // Wait for the current and next phases to end
          _animation.phaseEnded(self.prevStepId, stepDurations.currentPhase.animation, _animation._currentPhaseEnded);
          _animation.phaseEnded(id, stepDurations.nextPhase.animation, _animation._nextPhaseEnded);

          // Wait for the step (both phases) to finish animating
          _animation.stepEnded(id, stepDurations.maximum);
        }

        // This is the first run
        else {

          // Snap the first step into place without animation
          if (self.options.startingStepAnimatesIn === false) {

            // Set the first step's speed to 0 to have it immediately snap into place
            _animation.resetInheritedSpeed(activePhases.next.stepId, "animate-in");

            self.animationMap.stepsAnimating = 0;
            self.isActive = false;
          }

          // Animate the first step into place
          else {

            self.animationStarted(id, self);
            _animation._nextPhaseStarted(hashTagNav);

            nextPhaseDuration = activePhases.next.watchedTimings.maxTotal;
            var stepDurationTotal = nextPhaseDuration;

            // Wait for the next phase to end
            _animation.phaseEnded(id, nextPhaseDuration, _animation._nextPhaseEnded);

            // Wait for the step (both phases) to finish animating
            _animation.stepEnded(id, nextPhaseDuration);
          }

          // We're now done with the first run
          // Add the "animate-in" class to the next step
          self._firstRun = false;
          addClass(activePhases.next.stepElement, "animate-in");
          removeClass(activePhases.next.stepElement, "animate-out");
        }
      },

      /**
       * Determine how long a step's phases will animate for
       *
       * Note: the first time sequence.goTo() is run, the step duration
       * will always be the longest computed duration from the "animate-in"
       * phase, as the "animate-out" phase is immediately snapped into place.
       *
       * @param {Number} currentPhaseDuration - How long the current phase will
       * animate for
       * @param {Number} nextPhaseDuration - How long the next phase will
       * animate for
       * @param {Number} phaseThresholdTime - The amount of time in milliseconds
       * before the next step should start animating in
       * @returns {Object} durations - Return animation times for both phases
       */
      getStepDurations: function(currentPhaseDuration, nextPhaseDuration, phaseThresholdTime) {

        var durations = {};
        durations.currentPhase = {};
        durations.nextPhase = {};

        // How long the phase will animate (not including delays)
        durations.currentPhase.animation = currentPhaseDuration;
        durations.nextPhase.animation = nextPhaseDuration;

        // The time the next phase should wait before being set to "animate-in"
        // The total time it'll take for both phases to finish
        durations.maximum = 0;

        var phaseThreshold = self.options.phaseThreshold;

        switch (phaseThreshold) {

          case false:
          // The next phase should be set to "animate-in" immediately
          // The step ends whenever the longest phase has finished
          durations.nextPhase.animation = nextPhaseDuration;
          if (currentPhaseDuration > nextPhaseDuration) {
            durations.maximum = currentPhaseDuration;
          }else {
            durations.maximum = nextPhaseDuration;
          }
        break;

        case true:
          // The next phase should start only once the current phase has finished
          // The step ends once both phases have finished
          durations.nextPhase.animation = nextPhaseDuration + phaseThresholdTime;
          durations.maximum = currentPhaseDuration + nextPhaseDuration;
        break;

        default:
          // The next phase should be set to "animate-in" after a specific time
          // The step ends whenever the longest phase has finished (including
          // the phaseThreshold time)
          durations.nextPhase.animation = nextPhaseDuration + phaseThresholdTime;
          if (currentPhaseDuration > nextPhaseDuration + phaseThresholdTime) {
            durations.maximum = currentPhaseDuration;
          }else {
            durations.maximum = nextPhaseDuration + phaseThresholdTime;
          }
        }

        return durations;
      },

      /**
       * When the current phase starts animating
       */
      _currentPhaseStarted: function() {

        // Callback
        self.currentPhaseStarted(self);

        // Update pagination
        self._pagination.update();
      },

      /**
       * When the current phase finishes animating
       */
      _currentPhaseEnded: function() {

        // Callback
        self.currentPhaseEnded(self);
      },

      /**
       * When the next phase starts animating
       *
       * @param {Boolean} hashTagNav - If navigation is triggered by the hashTag
       */
      _nextPhaseStarted: function(hashTagNav) {

        // Update the hashTag if being used
        if (hashTagNav === undefined) {
          self._hashTags.update();
        }

        // Callback
        self.nextPhaseStarted(self);
      },

      /**
       * When the next phase finishes animating
       */
      _nextPhaseEnded: function() {

        // Callback
        self.nextPhaseEnded(self);
      },

      /**
       * Wait for a phases (animate-in or animate-out) animations to finish
       *
       * @param {Number} id - The id of the step the phase belongs to
       * @param {Number} phaseDuration - The amount of time before the phase
       * ends (in milliseconds)
       * @param {Function} callback - A function to execute when the phase ends
       */
      phaseEnded: function(id, phaseDuration, callback) {

        self.phaseEndedTimer = setTimeout(function() {

          self.animationMap["step" + id].isAnimating = false;
          self.animationMap.stepsAnimating -= 1;

          // Callback
          callback();
        }, phaseDuration);
      },

      /**
       * When a step's animations have completely finished
       *
       * @param {Number} id - The ID of the step that ended
       * @param {Number} stepDuration - The amount of time before the step
       * finishes animating
       */
      stepEnded: function(id, stepDuration) {

        self.stepEndedTimer = setTimeout(function() {
          self._autoPlay.init();

          self.isActive = false;

          // Callback
          self.animationEnded(id, self);
        }, stepDuration);
      },

      /**
       * Change "animate-out" to "animate-in" and vice-versa.
       *
       * @param {String} phase - The phase to reverse
       * @returns {String} - The reversed phase
       */
      reversePhase: function(phase) {

        var reversePhase = {
            "animate-out": "animate-in",
            "animate-in": "animate-out"
        };

        return reversePhase[phase];
      },

      /**
       * Apply a short delay to a function that manipulates the DOM. Allows for
       * sequential DOM manipulations.
       *
       * Why is this needed?
       *
       * When sequentially manipulating a DOM element (ie, removing a class then
       * immediately applying another on the same element), the first manipulation
       * appears not to apply. This function puts a small gap between sequential
       * manipulations to give the browser a chance visually apply each manipulation.
       *
       * Some browsers can apply a succession of classes quicker than
       * this but 50ms is enough to capture even the slowest of browsers.
       *
       * @param {Function} callback - a function to run after the delay
       */
      domDelay: function(callback) {

        setTimeout(function() {
          callback();
        }, domThreshold);
      },

      /**
       * Reverse a CSS timing function
       *
       * @param {String} timingFunction - The timing function to reverse
       * @returns {String} timingFunction - The reverse timing function
       */
      reverseTimingFunction: function(timingFunction) {

        // Convert timingFunction keywords to a cubic-bezier function
        // This is needed because some browsers return a keyword, others a function
        var timingFunctionToCubicBezier = {
          "linear"     : "cubic-bezier(0.0,0.0,1.0,1.0)",
          "ease"       : "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
          "ease-in"    : "cubic-bezier(0.42, 0.0, 1.0, 1.0)",
          "ease-in-out": "cubic-bezier(0.42, 0.0, 0.58, 1.0)",
          "ease-out"   : "cubic-bezier(0.0, 0.0, 0.58, 1.0)"
        };

        var cubicBezier,
            cubicBezierLength,
            reversedCubicBezier,
            i;

        // Convert the timing function to a cubic-bezier if it is a keyword
        if (timingFunction.indexOf("cubic-bezier") < 0) {
          timingFunction = timingFunctionToCubicBezier[timingFunction];
        }

        // Remove the CSS function and just get the array of points
        cubicBezier = timingFunction.replace("cubic-bezier(", "").replace(")", "").split(",");
        cubicBezierLength = cubicBezier.length;

        // Convert each point into a number (rather than a string)
        for (i = 0; i < cubicBezierLength; i++) {
          cubicBezier[i] = parseFloat(cubicBezier[i]);
        }

        // Reverse the cubic bezier
        reversedCubicBezier = [
          1 - cubicBezier[2],
          1 - cubicBezier[3],
          1 - cubicBezier[0],
          1 - cubicBezier[1]
        ];

        // Add the reversed cubic bezier back into a CSS function
        timingFunction = "cubic-bezier(" + reversedCubicBezier + ")";

        return timingFunction;
      },

      /**
       * Apply a transition-duration and transition-delay to each element
       * then remove these temporary values once the phase is reset.
       *
       * Can be used to apply 0 to both duration and delay so animates reset
       * back into their original places for example.
       *
       * @param {String} step - The step that the elements we'll reset belong to
       * @param {String} phase - The next phase "animate-in" or "animate-out"
       */
      resetInheritedSpeed: function(step, phase) {

        if (self.isFallbackMode === true) {
          return;
        }

        var _animation = this,
            el,
            i;

        // Get the step's elements and count them
        var stepElements = self.steps[step - 1].querySelectorAll("*"),
            numberOfStepElements = stepElements.length;

        // Temporarily apply a transition-duration and transition-delay to each
        // element we need to track.
        for (i = 0; i < numberOfStepElements; i++) {
          el = stepElements[i];

            el.style[Modernizr.prefixed("transition")] = "0ms 0ms";
        }

        /**
         * Note: Synchronously, an element's phase class is added/removed here.
         * To save the need for a callback though (and extra code), we instead rely
         * on the necessity for the .domDelay() function which doesn't remove the
         * inheritedStyles until after a brief delay. What would be the callback
         * is instead just placed after the call to .resetInheritedSpeed() and
         * from a synchronous point of view, occurs at this point, before the
         * following .domDelay();
         */

        // Remove the temporary transition-duration and transition-delay from each
        // element now it has been manipulated; allowing for the inherited styles
        // to take effect again.
        setTimeout(function() {

          for (i = 0; i < numberOfStepElements; i++) {

            el = stepElements[i];
            el.style[Modernizr.prefixed("transition")] = "";
          }
        }, domThreshold);
      },

      /**
       * When the sequence.goTo() function is specified without a direction, and
       * the cycle option is being used, get the shortest direction to the next step
       *
       * @param {Number} nextId - The Id of the step to go to
       * @param {Number} currentId - The Id of the current step
       * @param {Number} noOfSteps - The number of steps
       * @returns {Number} direction - The shortest direction between the
       * current slide and the next
       */
      getShortestDirection: function(nextId, currentId, noOfSteps) {

        var forwardDirection;
        var reverseDirection;
        var direction;

        if (nextId > currentId) {
          forwardDirection = nextId - currentId;
          reverseDirection = currentId + (noOfSteps - nextId);
        }else {
          reverseDirection = currentId - nextId;
          forwardDirection = nextId + (noOfSteps - currentId);
        }

        direction = (forwardDirection <= reverseDirection) ? 1: -1;

        return direction;
      },

      /**
       * Get the direction to navigate in based on whether the .goTo() function
       * has a defined direction, and if not, what options are being used.
       *
       * @param {Number} id - The id of the step to go to
       * @param {Number} direction - The defined direction 1 or -1
       * @returns {Number} direction - The direction 1 or -1
       */
      getDirection: function(id, direction) {

        var _animation = this;

        // If the developer has defined a direction, then use that
        if (direction !== undefined) {
          return direction;
        }

        // If a direction wasn't defined, work out the best one to use
        if (self.options.reverseWhenNavigatingBackwards === true || self.isFallbackMode === true) {

          if (direction === undefined && self.options.cycle === true) {
            direction = _animation.getShortestDirection(id, self.currentStepId, self.noOfSteps);
          }else if (direction === undefined) {
            direction = (id < self.currentStepId) ? -1: 1;
          }
        }

        else {

          direction = 1;
        }

        return direction;
      },

      /**
       * Determine what properties the browser supports. Currently tests:
       *
       * - transitions
       * - transform-style: preserve-3d
       * - animations
       *
       * @param {Object} dataAttributes - The data attributes used on steps
       */
      propertySupport: function(dataAttributes) {

        self.transitionsSupported = false;
        self.animationsSupported = false;
        self.transformStyleSupported = false;
        self.transformOriginSupported = true;
        self.isFallbackMode = false;

        // Does the browser support transform-style: preserve-3d?
        Modernizr.addTest('csstransformspreserve3d', function () {

          var prop = Modernizr.prefixed('transformStyle');
          var val = 'preserve-3d';
          var computedStyle;
          if (!prop) return false;

          prop = prop.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

          Modernizr.testStyles('#modernizr{' + prop + ':' + val + ';}', function (el, rule) {
            computedStyle = window.getComputedStyle ? getComputedStyle(el, null).getPropertyValue(prop) : '';
          });

          return (computedStyle === val);
        });

        // Does the theme require 3D support?
        self.requires3d = is3dRequired(dataAttributes);

        // Additional tests when 3D is required
        if (self.requires3d === true) {

          // Is transform-style: preserve-3d supported?
          if (Modernizr.csstransformspreserve3d === true) {
            self.transformStyleSupported = true;
          }

          /**
           * Determine if the browser has the transform-origin-z bug (should only
           * be in Webkit based browsers and not Blink).
           *
           * This feature detection is far from perfect and may return false
           * positives in the future. If this is the case, the workaround can be
           * disabled/enabled via the transformOriginWorkaround option.
           *
           * As the workaround will only be enabled when transformOrigin is prefixed
           * with -webkit-, we hope that when the prefix is removed, so too is the
           * bug and the world can rest happy knowing this function will be made
           * redundant.
           *
           * Use the transformOrigin workaround if:
           *
           * - The workaround is enabled in options
           * - Uses the -webkit- prefix for transformOrigin
           * - The browser is not Blink (separate Blink from WebKit)
           */
          if (self.options.transformOriginWorkaround === true && Modernizr.prefixed("transformOrigin") === "WebkitTransformOrigin" && !(window.chrome && 'CSS' in window)) {
            self.transformOriginSupported = false;
          }
        }

        // Are transitions supported?
        if (Modernizr.csstransitions === true) {
          self.transitionsSupported = true;
        }

        // Are animations supported?
        if (Modernizr.cssanimations === true) {
          self.animationsSupported = true;
        }


        // If the theme uses 3D transforms but they're not fully supported,
        // use fallback mode
        if (self.transitionsSupported === false || (self.transformStyleSupported === false && self.requires3d === true && self.options.require3d !== false)) {
          self.isFallbackMode = true;
        }
      }
    };

    /**
     * Controls Sequence's animations when in a browser that doesn't support
     * CSS transitions
     *
     * @api private
     */
    self._animationFallback = {

      /**
       * Animate an element using JavaScript
       *
       * @param {HTMLElement} element - The element to animate
       * @param {String} style - The style to be animated
       * @param {String} unit - The value unit such as "px", "%" etc
       * @param {Number} from - The start value of the animation
       * @param {Number} to - The end value of the animation
       * @param {Number} time - how long to animate for
       * @param {Function} callback - A function to execute once the animation
       * has finished
       */
      animate: function(element, style, unit, from, to, time, callback) {

        if (element === false) {
          return;
        }

        var start = new Date().getTime();

        var timer = setInterval(function() {

          var step = Math.min(1, (new Date().getTime()-start) / time);

          element.style[style] = (from + step * (to - from)) + unit;

          if (step === 1) {

            if (callback !== undefined) {
              callback();
            }

            clearInterval(timer);
          }
        }, 25);

        element.style[style] = from + unit;
      },

      /**
       * Setup the canvas ready for the fallback animation
       *
       * @param {Number} id - The first Id that Sequence will go to
       */
      setupCanvas: function(id) {

        if (self.isFallbackMode === true) {

          // Add the "seq-fallback" class to the Sequence element
          addClass(self.container, "seq-fallback");

          // Prevent steps from appearing outside of the Sequence screen
          self.screen.style.overflow = "hidden";

          // Make the canvas and screen 100% width/height
          self.canvas.style.width = "100%";
          self.canvas.style.height = "100%";
          self.screen.style.width = "100%";
          self.screen.style.height = "100%";

          // Get the width of the canvas
          this.canvasWidth = self.canvas.offsetWidth;

          // Make each step 100% width/height
          for (var i = 0; i < self.noOfSteps; i++) {

            // Get the step and its ID (one-based)
            var step = self.steps[i];
            var stepId = i + 1;

            /**
             * Move each step to its "animate-in" position
             *
             * Note: in fallback mode, steps will always remain in their
             * "animate-in" position
             */
            addClass(step, "animate-in");

            // Make the step 100% width/height
            step.style.width = "100%";
            step.style.height = "100%";
            step.style.position = "absolute";
            step.style.whiteSpace = "normal";

            // Move all steps to "animate-out"
            step.style.left = "100%";
          }
        }
      },

      /**
       * Move the canvas using basic animation
       *
       * @param {HTMLElement} nextStepElement - The element that is the next step
       * @param {HTMLElement} currentStepElement - The element that is the current step
       * @param {Number} direction - The direction to animate in
       * @param {Boolean} animate - Show the canvas animate or snap?
       */
      moveCanvas: function(nextStepElement, currentStepElement, direction, animate) {

        // Animate steps
        if (animate === true) {

          var currentFrom = 0,
              currentTo = -100,
              nextFrom = 100,
              nextTo = 0;

          if (direction === -1) {
            currentTo = 100;
            nextFrom = -100;
          }

          this.animate(currentStepElement, "left", "%", currentFrom, currentTo, self.options.fallback.speed);
          this.animate(nextStepElement, "left", "%", nextFrom, nextTo, self.options.fallback.speed);
        }

        // Snap steps into place
        else {

          currentStepElement.style.left = "-100%";
          nextStepElement.style.left = "0";
        }
      },

      /**
       * Go to a step using basic animation
       *
       * @param {Number} id - The ID of the step to go to
       * @param {String} currentStep - The name of the current step
       * @param {HTMLElement} currentStepElement - The element that is the current step
       * @param {String} nextStep - The name of the next step
       * @param {HTMLElement} nextStepElement - The element that is the next step
       * @param {Number} direction - The direction of navigation
       * @param {Boolean} hashTagNav - If navigation is triggered by the hashTag
       */
      goTo: function(id, currentStep, currentStepElement, nextStep, nextStepElement, direction, hashTagNav) {

        var from;

        // The next ID is now the current ID
        self.prevStepId = self.currentStepId;
        self.currentStepId = id;

        // Update the hashTag if being used
        if (hashTagNav === undefined) {
          self._hashTags.update();
        }

        // When should the "animate-in" phase start and how long until the step
        // completely finishes animating?
        if (self._firstRun === false) {

          this.moveCanvas(nextStepElement, currentStepElement, direction, true);

          // Callback
          self.animationStarted(self.currentStepId, self);
        }

        // This is the first step we're going to
        else {

          this.moveCanvas(nextStepElement, currentStepElement, direction, false);
          self._firstRun = false;
        }

        // Wait for the step (both phases) to finish animating
        self._animation.stepEnded();
        self._pagination.update();
      }
    };

    /**
     * Manage pagination
     *
     * @api private
     */
    self._pagination = {

      /**
       * Get the links from each pagination element (any top level elements)
       *
       * @param {HTMLElement} element - The pagination element
       * @param {String} rel - Which Sequence element the pagination relates
       * to (if any)
       * @param {Number} i - The number of the pagination element
       */
      getLinks: function(element, rel, i) {

        var childElement,
            childElements,
            childElementsLength,
            paginationLinks = [],
            j;

        // Get the pagination's link elements and count them
        childElements = element.childNodes;
        childElementsLength = childElements.length;

        // Get each top level pagination link and add it to the array
        for (j = 0; j < childElementsLength; j++) {

          childElement = childElements[j];

          if (childElement.nodeType === 1) {
            paginationLinks.push(childElement);
          }
        }

        // Save the pagination element and its links
        self.paginationLinks.push(paginationLinks);
      },

      /**
       * Update the pagination to activate the relevant link
       */
      update: function() {

        if(self.pagination !== undefined) {

          var i,
              j,
              id = self.currentStepId - 1,
              currentPaginationLink,
              currentPaginationLinksLength,
              paginationLength = self.pagination.length;

          // Remove the "seq-current" class from a previous pagination link
          // if there is one
          if (self.currentPaginationLinks !== undefined) {

            currentPaginationLinksLength = self.currentPaginationLinks.length;

            for (i = 0; i < currentPaginationLinksLength; i++) {

              currentPaginationLink = self.currentPaginationLinks[i];
              removeClass(currentPaginationLink, "seq-current");
            }
          }

          // Where we'll save the current pagination links
          self.currentPaginationLinks = [];

          // Get the current pagination link from each pagination element,
          // add the "seq-current" class to them, then save them for later
          // for when they need to have the "seq-current" class removed
          for (j = 0; j < paginationLength; j++) {

            currentPaginationLink = self.paginationLinks[j][id];
            self.currentPaginationLinks.push(currentPaginationLink);

            addClass(currentPaginationLink, "seq-current");
          }
        }
      }
    };

    /**
     * Manage Sequence hashTag support
     *
     * @api private
     */
    self._hashTags = {

      /**
       * Set up hashTags
       *
       * @param {Number} id - The id of the first step
       * @returns {Number} id - The id of the first step (_hashTags.init() will
       * override this if an entering URL contains a hashTag that corresponds
       * to a step)
       */
      init: function(id) {

        if (self.options.hashTags === true) {

          var correspondingStepId,
              newHashTag;

          // Does the browser support pushstate?
          self.hasPushstate = !!(window.history && history.pushState);

          // Get the current hashTag
          newHashTag = location.hash.replace("#!", "");

          // Get each step's hashTag
          self.stepHashTags = this.getStepHashTags();

          // If there is a hashTag but no value, don't go any further
          if (newHashTag === "") {
            return id;
          }

          // Get the current hashTag's step ID's
          self.currentHashTag = newHashTag;
          correspondingStepId = this.hasCorrespondingStep();

          // If the entering URL contains a hashTag, and the hashTag relates to
          // a corresponding step, the step's ID will override the startStepId
          // defined in options
          if (correspondingStepId > -1) {
            id = correspondingStepId + 1;
          }
        }

        // Return either the startingStepId as defined in settings or if the
        // entering URL contained a hashTag that corresponds to a step, return
        // its ID instead
        return id;
      },

      /**
       * Does a hashTag have a corresponding step?
       *
       * @returns {Number} correspondingStep - The step ID relating to the hashTag
       */
      hasCorrespondingStep: function() {

        var correspondingStep = -1;
        var correspondingStepId = self.stepHashTags.indexOf(self.currentHashTag);

        if (correspondingStepId > -1) {
          correspondingStep = correspondingStepId;
        }

        return correspondingStep;
      },

      /**
       * Get each steps hashTag to return an array of hashTags
       *
       * @returns {Array} stepHashTags - An array of hashTags
       */
      getStepHashTags: function() {

        var elementHashTag,
            stepHashTags = [];

        // Get each steps hashtag
        for (var i = 0; i < self.noOfSteps; i++) {

          elementHashTag = (self.options.hashDataAttribute === false) ? self.steps[i].id: self.steps[i].getAttribute("data-seq-hashtag");

          // Add the hashtag to an array
          stepHashTags.push(elementHashTag);
        }

        return stepHashTags;
      },

      /**
       * Update the hashTag if:
       *
       * - hashTags are being used and this isn't the first run
       * - hashTags are being used, this is the first run, and the first hash
       *   change is allowed in the options
       * - the current step has a hashTag
       */
      update: function() {

        if (self.options.hashTags === true && self._firstRun === false || (self.options.hashTags === true && self._firstRun === true && self.options.hashChangesOnFirstStep === true)) {

            // Zero-base the currentStepId
            var hashTagId = self.currentStepId - 1;

            // Get the current hashTag
            self.currentHashTag = self.stepHashTags[hashTagId];

            if (self.currentHashtag !== "") {

              // Add the hashTag to the URL
              if (self.hasPushstate === true) {
                history.pushState(null, null, "#!" + self.currentHashTag);
              }
              else {
                location.hash = "#!" + self.currentHashTag;
              }
            }
        }
      },

      /**
       * Cross Browser helper for an hashchange event
       * Source: http://stackoverflow.com/questions/9339865/get-the-hashchange-event-to-work-in-all-browsers-including-ie7/
       */
      setupEvent: function() {

        if ('onhashchange' in window) {

          if (window.addEventListener) {

            window.addHashChange = function(func, before) {
              window.addEventListener('hashchange', func, before);
            };

            window.removeHashChange = function(func) {
              window.removeEventListener('hashchange', func);
            };

            return;

          } else if (window.attachEvent) {

            window.addHashChange = function(func) {
              window.attachEvent('onhashchange', func);
            };

            window.removeHashChange = function(func) {
              window.detachEvent('onhashchange', func);
            };

            return;
          }
        }

        var hashChangeFuncs = [];
        var oldHref = location.href;

        window.addHashChange = function(func, before) {
          if (typeof func === 'function') {
            hashChangeFuncs[before?'unshift':'push'](func);
          }
        };

        window.removeHashChange = function(func) {
          for (var i=hashChangeFuncs.length-1; i>=0; i--) {
            if (hashChangeFuncs[i] === func) {
              hashChangeFuncs.splice(i, 1);
            }
          }
        };

        setInterval(function() {
          var newHref = location.href;
          if (oldHref !== newHref) {
            var _oldHref = oldHref;
            oldHref = newHref;
            for (var i=0; i<hashChangeFuncs.length; i++) {
              hashChangeFuncs[i].call(window, {
                'type': 'hashchange',
                'newURL': newHref,
                'oldURL': _oldHref
              });
            }
          }
        }, 100);
      }
    };

    /**
     * Manage Sequence preloading
     *
     * @api private
     */
    self._preload = {

      /**
       * Setup Sequence preloading
       *
       * @param {Function} callback - Function to execute when preloading has finished
       */
      init: function(callback) {

        var _preload = this;

        if (self.options.preloader !== false) {

          // Add a class of "seq-preloading" to the Sequence element
          addClass(self.container, "seq-preloading");

          // Get the preloader
          self.preloader = self._ui.getElements("preloader", self.options.preloader);

          // Add the preloader element if necessary
          _preload.append();

          // Add the preloader's default styles
          _preload.addStyles();

          // Hide steps if necessary
          _preload.hideAndShowSteps("hide");

          // Get images from particular Sequence steps to be preloaded
          // Get images with specific source values to be preloaded
          var stepImagesToPreload = this.saveImagesToArray(self.options.preloadTheseSteps);
          var individualImagesToPreload = this.saveImagesToArray(self.options.preloadTheseImages, true);

          // Combine step images and individual images
          var imagesToPreload = stepImagesToPreload.concat(individualImagesToPreload);

          // Initiate the imagesLoaded plugin
          var imgLoad = imagesLoaded(imagesToPreload);

          // When imagesLoaded() has finished (regardless of whether images
          // completed or failed to load)
          imgLoad.on("always", function(instance) {
            _preload.complete(callback);
          });

          // Track the number of images that have loaded so far
          var progress = 1;

          imgLoad.on("progress", function( instance, image ) {

            // Has the image loaded or is it broken?
            var result = image.isLoaded ? 'loaded' : 'broken';

            // Callback
            self.preloadProgress(result, image.img.src, progress++, imagesToPreload.length, self);
          });
        }
      },

      /**
       * When preloading has finished, show the steps again and hide the preloader
       *
       * @param {Function} callback - Function to execute when preloading has finished
       */
      complete: function(callback) {

        // Callback
        self.preloaded(self);

        // Show steps if necessary
        this.hideAndShowSteps("show");

        // Remove the "preloading" class and add the "preloaded" class
        removeClass(self.container, "seq-preloading");
        addClass(self.container, "seq-preloaded");

        // Hide the preloader
        this.hide();

        callback();
      },

      /**
       * Sequence's default preloader styles and animation for the preloader icon
       */
     defaultStyles: '.seq-preloader {position: absolute;z-index: 9999;height: 100%;width: 100%;top: 0;left:0;right:0;bottom:0;}.seq-preloader .preload .circle {position: relative;top: -50%;display: inline-block;height: 12px;width: 12px;fill: #ff9442;}.preload {position: relative;top: 50%;display: block;height: 12px;width: 48px;margin: -6px auto 0 auto;}.preload-complete {opacity: 0;visibility: hidden;'+Modernizr.prefixed("transition")+': .5s;}.preload.fallback .circle {float: left;margin-right: 4px;background-color: #ff9442;border-radius: 6px;}',

      /**
       * Add the preloader's styles to the <head></head>
       */
      addStyles: function() {

        if (self.options.preloader === true) {

          // Get the <head> and create the <style> element
          var head = document.head || document.getElementsByTagName('head')[0];
          this.styleElement = document.createElement('style');

          // Add the default styles to the <style> element
          this.styleElement.type = 'text/css';
          if (this.styleElement.styleSheet) {
            this.styleElement.styleSheet.cssText = this.defaultStyles;
          }else {
            this.styleElement.appendChild(document.createTextNode(this.defaultStyles));
          }

          // Add the <style> element to the <head>
          head.appendChild(this.styleElement);

          // Animate the preloader using JavaScript if the browser doesn't support SVG
          if (Modernizr.svg === false) {

            // Get the preload indicator
            var preloadIndicator = self.preloader[0].firstChild;

            // Make the preload indicator flash
            this.preloadIndicatorTimer = setInterval(function() {
              preloadIndicator.style.visibility = "hidden";
              setTimeout(function() {
                preloadIndicator.style.visibility = "visible";
              }, 250);

            }, 500);
          }
        }
      },

      /**
       * Remove the preloader's styles from the <head></head>
       */
      removeStyles: function() {

        this.styleElement.parentNode.removeChild(this.styleElement);
      },

      /**
       * Get <img> elements and return them to be preloaded. Elements can be got
       * either via the <img> element itself or a src attribute.
       *
       * @param {Number} images - The <img> elements or image src attributes to save
       * @param {Boolean} srcOnly - Is the element to be retrieved via the src?
       * @returns {Array} imagesToPreload - The images to preload
       */
      saveImagesToArray: function(images, srcOnly) {

        // Where we'll save the images
        var imagesToPreload = [];

        // If there aren't any images, return an empty array
        if (isArray(images) === false) {
          return imagesToPreload;
        }

        var i,
            j,
            imageLength = images.length;

        // Get each step's <img> elements and add them to imagesToPreload
        if (srcOnly !== true) {

          // Get each step
          for (i = 0; i < imageLength; i++) {

            // Get the step and any images belonging to it
            var step = self.steps[i];
            var imagesInStep = step.getElementsByTagName("img");
            var imagesInStepLength = imagesInStep.length;

            // Get each image within the step
            for (j = 0; j < imagesInStepLength; j++) {

              var image = imagesInStep[j];
              imagesToPreload.push(image);
            }
          }
        }

        // Get each step's <img> elements via the src and add them to imagesToPreload
        else {

          var img = [];

          for (i = 0; i < imageLength; i++) {
            var src = images[i];

            img[i] = new Image();
            img[i].src = src;

            imagesToPreload.push(img[i]);
          }
        }

        return imagesToPreload;
      },

      /**
       * Hide the preloader using CSS transitions if supported, else use JavaScript
       */
      hide: function() {

        var _preload = this;

        if (self.transitionsSupported === true) {
          addClass(self.preloader, "preload-complete");
        }else {

          self._ui.hide(self.preloader[0], 500);
        }

        // Stop the preload inidcator fading in/out (for non-SVG browsers only)
        clearInterval(this.preloadIndicatorTimer);

        // Remove the preloader once it has been hidden
        setTimeout(function() {
          _preload.remove();
        }, 500);
      },

      /**
       * Append the default preloader
       */
      append: function() {

        if (self.options.preloader === true && self.preloader.length === 0) {

          // Set up the preloader container
          self.preloader = document.createElement("div");
          self.preloader.className = "seq-preloader";

          self.preloader = [self.preloader];

          // Use the SVG preloader
          if (Modernizr.svg === true) {

            self.preloader[0].innerHTML = '<svg class="preload" xmlns="http://www.w3.org/2000/svg"><circle class="circle" cx="6" cy="6" r="6" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" /></circle><circle class="circle" cx="22" cy="6" r="6" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1s" begin="150ms" repeatCount="indefinite" /></circle><circle class="circle" cx="38" cy="6" r="6" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1s" begin="300ms" repeatCount="indefinite" /></circle></svg>';
          }

          // Use the Non-SVG preloader
          else {

            self.preloader[0].innerHTML = '<div class="preload fallback"><div class="circle"></div><div class="circle"></div><div class="circle"></div></div>';
          }

          // Add the preloader
          self.container.insertBefore(self.preloader[0], null);
        }
      },

      /**
       * Remove the preloader
       */
      remove: function() {

        self.preloader[0].parentNode.removeChild(self.preloader[0]);

        // If using the default preloader, remove its styles
        if (self.options.preloader === true) {
          this.removeStyles();
        }
      },

      /**
       * If enabled, hide/show Sequence steps until preloading has finished
       *
       * @param {String} type - "show" or "hide"
       */
      hideAndShowSteps: function(type) {

        if (self.options.hideStepsUntilPreloaded === true && self.preloader.length !== 0) {

          // Hide or show each step
          for (var i = 0; i < self.noOfSteps; i++) {
            var step = self.steps[i];

            if (type === "hide") {
              self._ui.hide(step, 0);
            }else {
              self._ui.show(step, 0);
            }

          }
        }
      }
    };

    /**
     * Add and remove Sequence events
     *
     * @api public
     */
    self.manageEvent = {

      // Keep track of the added events here
      list: {
        "load": [],
        "click": [],
        "touchstart": [],
        "mousemove": [],
        "mouseleave": [],
        "hammer": [],
        "keydown": [],
        "hashchange": [],
        "resize": []
      },

      /**
       * Set up events on init
       */
      init: function() {

        this.add.hashChange();

        if (self.options.swipeNavigation === true) {
          this.add.swipeNavigation();
        }

        if (self.options.keyNavigation === true) {
          this.add.keyNavigation();
        }

        this.add.resizeThrottle();

        // If being used, get the next button(s) and set up the events
        if (self.options.nextButton !== false) {
          self.nextButton = self._ui.getElements("nextButton", self.options.nextButton);

          this.add.button(self.nextButton, "nav", self.next);
        }

        // If being used, get the next button(s) and set up the events
        if (self.options.prevButton !== false) {
          self.prevButton = self._ui.getElements("prevButton", self.options.prevButton);
          this.add.button(self.prevButton, "nav", self.prev);
        }

        // If being used, get the pause button(s) and set up the events
        if (self.options.pauseButton !== false) {
          self.pauseButton = self._ui.getElements("pauseButton", self.options.pauseButton);
          this.add.button(self.pauseButton, "nav", self.togglePause);
        }

        // If being used, set up the pauseOnHover event
        this.add.pauseOnHover();

        // If being used, get the pagination element(s) and set up the events
        if (self.options.pagination !== false) {

          self.paginationLinks = [];

          self.pagination = self._ui.getElements("pagination", self.options.pagination);
          this.add.button(self.pagination, "pagination");
        }
      },

      /**
       * Remove an event from all of the elements it is attached to
       *
       * @param {String} type - The type of event to remove eg. "click"
       */
      remove: function(type) {

        // Get the elements using the event and count them
        var eventElements = self.manageEvent.list[type];
        var eventElementsLength = eventElements.length;

        switch(type) {

          case "hashchange":
            removeHashChange(eventElements[0].handler);
          break;

          case "hammer":

            if (self.manageEvent.list.hammer.length > 0 && document.querySelectorAll !== undefined) {

              var handler = self.manageEvent.list.hammer[0].handler;
              self.hammerTime.off("swipe", [handler]);
            }
          break;

          default:
            // Remove the event from each element
            for (var i = 0; i < eventElementsLength; i++) {
              var eventProperties = eventElements[i];
              removeEvent(eventProperties.element, type, eventProperties.handler);
            }
        }
      },

      add: {

        /**
         * Add the hashchange event
         */
        hashChange: function() {

          // Setup the cross-browser hashchange event
          self._hashTags.setupEvent();

          var handler = function(e) {

            var newHashTag,
                id;

            // Get the hashTag from the URL
            newHashTag = e.newURL || location.href;
            newHashTag = newHashTag.split("#!")[1];

            // Go to the new step if we're not already on it
            if (self.currentHashTag !== newHashTag) {

              // Get the ID of the new hash tag and one-base it
              id = self.stepHashTags.indexOf(newHashTag) + 1;

              self.currentHashTag = newHashTag;

              /**
               * Go to the new step
               *
               * Note: When the user is navigating through history via their
               * browser's back/forward buttons for example, we can't prevent
               * going to a step to meet the navigationSkipThreshold option. To
               * prevent the hashTag and the current step from becoming
               * unsynchronized we must ignore the navigationSkipThreshold
               * setting.
               */
              self.goTo(id, undefined, undefined, true);
            }
          };

          addHashChange(handler);

          self.manageEvent.list.hashchange.push({"element": window, "handler": handler});
        },

        /**
         * Add next/prev/pause buttons
         *
         * @param {Array} elements - The element or elements acting as the next button
         * @param {String} type - The type of button being added - "nav" or "pagination"
         * @param {Function} callback - Function to execute when the button is clicked
         */
        button: function(elements, type, callback) {

          // Count the number of elements being added
          var elementsLength = elements.length,
              handler,
              element,
              targetElement,
              buttonEvent,
              parent,
              rel,
              id,
              i;

          // Set up a click event for navigation elements
          if (type === "nav") {

            buttonEvent = function(element) {

              handler = addEvent(element, "click", function(e) {

                callback();
              });
            };
          }

          // Set up a click event for pagination
          else {

            buttonEvent = function(element, rel, i) {

              handler = addEvent(element, "click", function(event, element) {

                if (!event) {
                  event = window.event;
                }

                var targetElement = event.target || event.srcElement;

                parent = this;

                // Get the ID of the clicked pagination link
                id = hasParent(parent, targetElement);

                // Go to the clicked pagination ID
                self.goTo(id);
              });

              // Get the pagination links
              self._pagination.getLinks(element, rel, i);
            };
          }

          // Add a click event for each element
          for (i = 0; i < elementsLength; i++) {
            element = elements[i];

            // Does the button control a specific Sequence instance?
            rel = element.getAttribute("rel");

            // The button controls one Sequence instance
            // (defined via the rel attribute)
            if (rel === self.container.id && element.getAttribute("data-seq") !== "true") {

              element.setAttribute("data-seq", true);
              buttonEvent(element, rel, i);
            }

            // The button controls all Sequence instances
            else if (rel === null && element.getAttribute("data-seq") !== "true") {

              buttonEvent(element, rel, i);
            }

            // Save the element and its handler for later, should it need to
            // be removed
            self.manageEvent.list.click.push({"element": element, "handler": handler});
          }
        },

        /**
         * Pause and unpause autoPlay when the user's cursor enters and leaves
         * the Sequence element accordingly.
         *
         * Note: autoPlay will be paused only when the cursor is inside the
         * boundaries of the Sequence element, either on the element itself or
         * its children. Child elements overflowing the Sequence element will
         * not cause Sequence to be paused.
         */
        pauseOnHover: function() {

          /**
           * Determine if the cursor is inside the boundaries of the Sequence
           * element.
           *
           * @param {Object} element - The Sequence element
           * @param {Object} cursor - The event holding cursor properties
           */
          var insideElement = function(element, cursor) {

            // Get the elements boundaries
            var rect = element.getBoundingClientRect();

            // Return true if inside the boundaries of the Sequence element
            if (cursor.clientX >= rect.left && cursor.clientX <= rect.right && cursor.clientY >= rect.top && cursor.clientY <= rect.bottom) {
              return true;
            }else {
              return false;
            }
          };

          var previouslyInside = false,
              touchHandler,
              handler;

          /**
           * Determine when the user touches the container. This is so we can
           * disable the use of pauseOnHover for touches, but not for mousemove
           */
          touchHandler = addEvent(self.container, "touchstart", function(e) {

            self.isTouched = true;
          });

          self.manageEvent.list.touchstart.push({"element": self.container, "handler": touchHandler});


          /**
           * Pause autoPlay only when the cursor is inside the boundaries of the
           * Sequence element
           */
          handler = addEvent(self.container, "mousemove", function(e) {

            e = e || window.event;

            // If the user touched the container, don't pause - pauseOnHover
            // should only occur when a mouse cursor is used
            if (self.isTouched === true) {
              self.isTouched = false;
              return;
            }

            // Is the cursor inside the Sequence element?
            if (insideElement(self.container, e) === true) {

              // Pause if the cursor was previously outside the Sequence element
              if (self.options.pauseOnHover === true && self.isPaused === false) {
                self._autoPlay.pause();
              }

              // We're now inside the Sequence element
              self.isMouseOver = true;
            }

            else {

              // Unpause if the cursor was previously inside the Sequence element
              if (self.options.autoPlay === true && self.options.pauseOnHover === true && self.isMouseOver === true && self.isHardPaused === false) {
                self._autoPlay.unpause();
              }

              // We're now outside the Sequence element
              self.isMouseOver = false;
            }
          });

          self.manageEvent.list.mousemove.push({"element": self.container, "handler": handler});

          /**
           * Unpause autoPlay when the cursor leaves the Sequence element
           */
          handler = addEvent(self.container, "mouseleave", function(e) {

            if (self.options.pauseOnHover === true && self.isHardPaused === false) {
              self._autoPlay.unpause();
            }

            // We're now outside the Sequence element
            self.isMouseOver = false;
          });

          self.manageEvent.list.mouseleave.push({"element": self.container, "handler": handler});
        },

        /**
         * Navigate to a step when Sequence is swiped
         */
        swipeNavigation: function() {

          // Don't use swipe navigation if the browser doesn't support
          // addEventListener (Hammer.js needs it)
          if (window.addEventListener === undefined) {
            return;
          }

          var handler = function(e) {

            switch(e.direction) {

              case 2:
                self.options.swipeEvents.left(self);
              break;

              case 4:
                self.options.swipeEvents.right(self);
              break;
            }
          };

          if(typeof Hammer === "function") {
            self.hammerTime = new Hammer(self.container).on("swipe", handler);

              // Set Hammer's Swipe options
              self.hammerTime.get("swipe").set(self.options.swipeHammerOptions);

              self.manageEvent.list.hammer.push({"element": self.container, "handler": handler});
          }
        },

        /**
         * Navigate to a step when corresponding keys are pressed
         */
        keyNavigation: function() {

          var handler = addEvent(document, "keydown", function(event) {

            if (!event) {
              event = window.event;
            }

            // Get the key pressed
            var keyCodeChar = parseInt(String.fromCharCode(event.keyCode));

            // Go to the numeric key pressed
            if ((keyCodeChar > 0 && keyCodeChar <= self.noOfSteps) && (self.options.numericKeysGoToSteps)) {
              self.goTo(keyCodeChar);
            }

            // When left/right arrow keys are pressed, go to prev/next steps
            switch(event.keyCode) {
              case 37:
                self.options.keyEvents.left(self);
              break;

              case 39:
                self.options.keyEvents.right(self);
              break;
            }
          });

          self.manageEvent.list.keydown.push({"element": document, "handler": handler});
        },

        /**
         * Throttle the window resize event so it only occurs every x amount of
         * milliseconds, as defined by the resizeThreshold global variable.
         */
        resizeThrottle: function() {

          // Events to be executed when the throttled window resize occurs
          function throttledEvents() {

            var i,
                step,
                stepName;

            // Get data attributes and transform properties again
            self._canvas.getTransformProperties();

            /**
             * Snap to the currently active step
             *
             * Assume the canvas is laid out in a 2 x 2 grid, the Sequence
             * element has a height of 100%, and the user is viewing the second
             * row of steps -- when the user resizes the window, the second row
             * of steps will no longer be positioned perfectly in the window.
             * This event will immediately snap the canvas back into place.
             */

            if (self.transitionsSupported === true) {
              self._canvas.move(self.currentStepId, false);
            }

            // Callback
            self.throttledResize(self);
          }

          /**
           * Throttle the resize event to only execute throttledEvents() every
           * 100ms. This is so not too many events occur during a resize. The
           * threshold can be changed using the resizeThreshold global variable.
           */
          var throttleTimer,
              handler;

          handler = addEvent(window, "resize", function(e) {

            clearTimeout(throttleTimer);
            throttleTimer = setTimeout(throttledEvents, resizeThreshold);
          });

          self.manageEvent.list.resize.push({"element": window, "handler": handler});
        }
      }
    };

    /**
     * Set up an instance of Sequence
     *
     * @param {Object} element - The element Sequence is attached to
     * @api private
     */
    self._init = function(element) {

      var id,
          prevStep,
          prevStepId,
          transformProperties,
          goToFirstStep;

      // Merge developer options with defaults
      self.options = extend(defaults, options);

      // Get the element Sequence is attached to, the screen,
      // the canvas and it's steps
      self.container = element;
      self.screen = self.container.querySelectorAll(".seq-screen")[0];
      self.canvas = self.container.querySelectorAll(".seq-canvas")[0];
      self.steps = getSteps(self.canvas);

      addClass(self.container, "seq-active");

      self.isHardPaused = false;
      self.isPaused = (self.options.autoPlay === true) ? false : true;
      self.isActive = false;

      // Count number of steps
      self.noOfSteps = self.steps.length;

      // Where we'll save info about the animation
      self.animationMap = {};
      self.animationMap.stepsAnimating = 0;

      // Get the first step's ID
      id = self.options.startingStepId;

      // Get the transform properties used on each step from their data
      // attributes
      transformProperties = self._canvas.getTransformProperties();

      // Find out what properties the browser supports and whether we need to
      // go into fallback mode
      self._animation.propertySupport(transformProperties);

      // Set up the canvas and screen with the necessary CSS properties
      self._canvas.setup(id);

      // Remove the no-JS "animate-in" class from a step
      removeNoJsClass(self);

      // Set up events
      self.manageEvent.init();

      // Set up autoPlay
      self._autoPlay.init();

      // On the first run, we need to treat the animation a little differently
      self._firstRun = true;

      // Set up hashTag support if being used and override the first ID if there
      // is a hashTag in the entering URL that has a corresponding step
      id = self._hashTags.init(id);

      // Get the previous step ID
      if (self.options.autoPlayDirection === 1) {
        prevStepId = id - 1;
        self.prevStepId = (prevStepId < 1) ? self.noOfSteps: prevStepId;
      }else {
        prevStepId = id + 1;
        self.prevStepId = (prevStepId > self.noOfSteps) ? 1: prevStepId;
      }

      // Get the previous step and next step
      self.currentStepId = self.prevStepId;
      prevStep = self.prevStepId;

      // If the browser doesn't support CSS transitions, setup the fallback
      self._animationFallback.setupCanvas(id);

      goToFirstStep = function() {

        // Callback
        if (self.options.autoPlay === true) {
          self.unpaused(self);
        }

        // Snap the previous step into position
        self._animation.domDelay(function() {
          self._animation.resetInheritedSpeed(prevStep, "animate-out");
        });

        // Go to the first step
        self.goTo(id, self.options.autoPlayDirection, true);
      };

      // Set up preloading if required, then go to the first step
      if (self.options.preloader !== false && document.querySelectorAll !== undefined && typeof imagesLoaded === "function") {

        self._preload.init(function() {

          goToFirstStep();

          self._animation.domDelay(function() {
            self.ready(self);
          });
        });
      }else {
        goToFirstStep();

        self._animation.domDelay(function() {
          self.ready(self);
        });
      }
    };

    /**
     * Destroy an instance of Sequence
     *
     * @returns {Boolean}
     * @api public
     */
    self.destroy = function() {

      var eventList,
          eventType,
          theEvents,
          i,
          step,
          lastStep;

      // Stop timers
      clearTimeout(self.autoPlayTimer);
      clearTimeout(self.phaseThresholdTimer);
      clearTimeout(self.stepEndedTimer);
      clearTimeout(self.phaseEndedTimer);

      // Get all events
      eventList = self.manageEvent.list;

      // Remove each event
      for (eventType in eventList) {
        if (eventList.hasOwnProperty(eventType) === true) {

          theEvents = eventList[eventType];
          self.manageEvent.remove(eventType);
        }
      }

      // Remove classes:
      // - the "seq-current" class from the active pagination links
      // - the "seq-paused" class from the container
      // - the step index class from the container
      // - the "seq-active" class from the container
      removeClass(self.currentPaginationLinks, "seq-current");
      removeClass(self.container, "seq-paused");
      removeClass(self.container, "seq-step" + self.currentStepId);
      removeClass(self.container, "seq-active");

      // Remove styles
      self.screen.removeAttribute("style");
      self.canvas.removeAttribute("style");

      // Remove styles from steps and snap them to their "animate-out" position
      for (i = 0; i < self.noOfSteps; i++) {
        step = self.steps[i];

        step.removeAttribute("style");
        self._animation.resetInheritedSpeed(i + 1, "animate-out");
        removeClass(step, "animate-in");
        removeClass(step, "animate-out");
      }

      // Snap the starting step back into its "animate-in" position
      lastStep = self.steps[self.options.startingStepId - 1];
      self._animation.resetInheritedSpeed(self.options.startingStepId, "animate-in");
      addClass(lastStep, "animate-in");

      // Allow the same element to have Sequence initated on it in the future
      element.setAttribute("data-seq-enabled", false);

      // Callback
      self.destroyed(self);

      // Finally, clear the instance's properties and methods
      self = {};
    };

    /**
     * Go to the next step
     *
     * @api public
     */
    self.next = function() {

      var nextStepId = self.currentStepId + 1;

      if (nextStepId > self.noOfSteps && self.options.cycle === true) {
        nextStepId = 1;
      }

      self.goTo(nextStepId);
    };

    /**
     * Go to the previous step
     *
     * @api public
     */
    self.prev = function() {

      var prevStepId = self.currentStepId - 1;

      if (prevStepId < 1 && self.options.cycle === true) {
        prevStepId = self.noOfSteps;
      }

      self.goTo(prevStepId);
    };

    /**
     * Stop and start Sequence's autoPlay feature
     *
     * @api public
     */
    self.togglePause = function() {

      if (self.isPaused === false) {
        self.pause();
      }else {
        self.unpause();
      }
    };

    /**
     * Stop Sequence's autoPlay feature
     *
     * isPaused = autoPlay is paused by Sequence and expects to be unpaused in
     * the future. For example: when the user hovers over the Sequence element.
     *
     * isHardPaused = autoPlay is paused by the user via a pause button or
     * public method. For example: whent the user presses a pause button.
     *
     * @api public
     */
    self.pause = function() {

      self.options.autoPlay = false;
      self.isHardPaused = true;
      self._autoPlay.pause();
    };

    /**
     * Start Sequence's autoPlay feature
     *
     * @api public
     */
    self.unpause = function() {

      self.options.autoPlay = true;
      self.isHardPaused = false;
      self._autoPlay.unpause();
    };

    /**
     * Go to a specific step
     *
     * @param {Number} id - The ID of the step to go to
     * @param {Number} direction - Direction to get to the step
     * (1 = forward, -1 = reverse)
     * @param {Boolean} ignorePhaseThreshold - if true, ignore the
     * transitionThreshold setting and immediately go to the specified step
     * @param {Boolean} hashTagNav - If navigation is triggered by the hashTag
     * @api public
     */
    self.goTo = function(id, direction, ignorePhaseThreshold, hashTagNav) {

      // Get the direction to navigate if one wasn't specified
      direction = self._animation.getDirection(id, direction);

      /**
       * Don't go to a step if:
       *
       * - ID isn't defined
       * - It doesn't exist
       * - It is already active
       * - navigationSkip isn't allowed and an animation is active
       * - navigationSkip is allowed but the threshold is yet to expire (unless
       *   navigating via forward/back button with hashTags enabled - see
       *   manageEvent.add.hashChange() for an explanation of this)
       * - transitions aren't supported and Sequence is active (navigation
       *   skipping isn't allowed in fallback mode, unless navigating via
       *   forward/back buttons)
       * - preventReverseSkipping is enabled and the user is trying to navigate
       *   in a different direction to the one already active
       */
      if (id === undefined || id < 1 || id > self.noOfSteps || id === self.currentStepId || (self.options.navigationSkip === false && self.isActive === true) || (self.options.navigationSkip === true && self.navigationSkipThresholdActive === true && hashTagNav === undefined) || (self.isFallbackMode === true && self.isActive === true && hashTagNav === undefined) || (self.options.preventReverseSkipping === true && self.direction !== direction && self.isActive === true)) {
        return false;
      }

      var phaseThresholdTime = 0;

      // Clear the previous autoPlayTimer
      clearTimeout(self.autoPlayTimer);

      // Save the latest direction
      self.direction = direction;

      // Get the step number, element, its animated elements (child nodes), and
      // max timings
      var currentPhaseProperties = self._animation.getPhaseProperties(self.currentStepId, "current"),
          nextPhaseProperties = self._animation.getPhaseProperties(id, "next");

      var activePhases = self.animationMap.activePhases = {
        "current": currentPhaseProperties,
        "next": nextPhaseProperties
      };

      // How long before the next phase should start?
      // Ignore the phaseThreshold (on first run for example)
      if (ignorePhaseThreshold === undefined) {
        if (self.options.phaseThreshold === true) {
          phaseThresholdTime = activePhases.current.timings.maxTotal;
        } else if (self.options.phaseThreshold !== false) {
          phaseThresholdTime = self.options.phaseThreshold;
        }
      }

      // Determine how often goTo() can be used based on
      // navigationSkipThreshold and manage step fading accordingly
      self._animation.manageNavigationSkip(id, direction);

      // Move the active step to the top (via a higher z-index)
      self._animation.moveActiveStepToTop(activePhases.current.stepElement, activePhases.next.stepElement);

      // Sequence is now animating
      self.isActive = true;

      // Change the step number on the Sequence element
      self._animation.changeStep(id);

      if (self.isFallbackMode === false) {

        // Animate the canvas
        self._canvas.move(id, true);

        // Reset the next step's elements durations to 0ms so it can be snapped into place
        self._animation.resetInheritedSpeed(activePhases.next.stepId, "animate-out");

        // Are we moving the active phases forward or in reverse?
        if (direction === 1) {
          self._animation.forward(id, activePhases, phaseThresholdTime, hashTagNav);
        } else {
          self._animation.reverse(id, activePhases, phaseThresholdTime, hashTagNav);
        }
      }

      // Use fallback animation
      else {

        self._animationFallback.goTo(id, activePhases, direction, hashTagNav);
      }
    };

    /* --- CALLBACKS --- */

    /**
     * Callback executed when autoPlay is paused
     */
    self.paused = function(self) {};

    /**
     * Callback executed when autoPlay is unpaused
     */
    self.unpaused = function(self) {};

    /**
     * Callback executed when a step animation starts
     *
     * @param {Number} id - The ID of the step that was started
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.animationStarted = function(id, self) {

      // console.log("animation started")
    };

    /**
     * Callback executed when a step animation finishes
     *
     * @param {Number} id - The ID of the step that finished
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.animationEnded = function(id, self) {

      console.log("Animation ended", id)
    };

    /**
     * Callback executed when the current phase starts animating
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.currentPhaseStarted = function(self) {

      // console.log("Current phase started");
    };

    /**
     * Callback executed when the current phase finishes animating
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.currentPhaseEnded = function(self) {

      console.log("Current phase ended");
    };

    /**
     * Callback executed when the next phase starts animating
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.nextPhaseStarted = function(self) {

      console.log("Next phase started");
    };

    /**
     * Callback executed when the next phase finishes animating
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.nextPhaseEnded = function(self) {

      console.log("Next phase ended");
    };

    /**
     * When the throttled window resize event occurs
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.throttledResize = function(self) {};

    /**
     * Callback executed when preloading has finished
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.preloaded = function(self) {};

    /**
     * Callback executed every time an image to be preloaded returns a status
     *
     * @param {String} result - Whether the image is "loaded" or "broken"
     * @param {String} src - The source of the image
     * @param {Number} progress - The number of images that have returned a result
     * @param {Number} length - The total number of images that are being preloaded
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.preloadProgress = function(result, src, progress, length, self) {};

    /**
     * Callback executed when Sequence is ready to be interacted with
     * = preloading + domDelay
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.ready = function(self) {

      // console.log("Ready");
    };

    /**
     * Callback executed when Sequence has finished being destroyed via .destroy()
     *
     * @param {Object} self - Properties and methods available to this instance
     * @api public
     */
    self.destroyed = function(self) {};

    /**
    * Make some of Sequence's helper functions public
    *
    * addClass() / removeClass() etc can be useful for custom theme code
    */
    self._utils = {
      addClass: addClass,
      removeClass: removeClass,
      addEvent: addEvent,
      removeEvent: removeEvent
    };


    /* --- INIT --- */

    // Set up an instance of Sequence
    self._init(element);

    // Expose this instances public variables and methods
    return self;
  });

  return Sequence;
}

var sequence = defineSequence();
