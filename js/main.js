/*globals mob, Spinner, Path, Modernizr, zot */

(function() {

  // ----------
  window.mob = _.extend({
    Pages: {},
    server: {},
    currentView: null,
    spinner: null,
    mode: '',
    STATUS_OPEN: 1,
    STATUS_CLOSED: 2,
    
    // ----------
    init: function() {
      var self = this;
      
      this.$user = $('.user');
      if (!this.loggedIn()) {
        $('<a href="#">Sign In</a>')
          .click(function(event) {
            event.preventDefault();
            self.logIn();
          })
          .appendTo(this.$user);
      } else {
        this.showLoggedIn();
      }
      
      $(document).on("click", "a", function(event) {
        if (Modernizr.history) {
          event.preventDefault();
          Path.history.pushState({}, '', $(this).attr('href'));
        }
      });
      
      var routes = {
        Home: '',
        NewIssue: '/new-issue',
        EditIssue: '/issue/:id/edit',
        Issue: '/issue/:id'
      };
      
      _.each(routes, function(v, k) {
        Path.map(v + '(/)').to(function() {
          self.go(k, this.params);
        });
      });
      
      Path.history.listen();
      Path.dispatch(document.location.pathname);
    },
    
    navigate: function(path) {
      if (Modernizr.history) {
        Path.history.pushState({}, '', path);
      } else {
        location.href = path;
      }
    },
    
    // ----------
    go: function(mode, config) {
      config = config || {};
      
      var $div = $("<div>")
        .addClass(mode)
        .append(this.template(mode + '-page'));
        
      $(".main-content")
        .empty()
        .append($div);
        
      this.mode = mode;
      if (this.mode in this.Pages) {
        config.$el = $div;
        this.currentView = new this.Pages[this.mode](config);
      }
    },
    
    // ----------
    spin: function(value) {
      if (value) {
        this.spinner = new Spinner().spin($("body")[0]);     
      } else {
        this.spinner.stop();
      }
    },
    
    // ----------
    template: function(name, config) {
      var rawTemplate = $("#" + name + "-template").text();
      var template = _.template(rawTemplate);
      var html = template(config);
      return $(html);
    },

    // ----------
    displayDate: function(isoDate) {
      return new Date(isoDate).toDateString();
    },
    
    // ----------
    request: function(config) {
      var self = this;
      
      var handleError = function(code) {
        self.error(code); // Do something fancier
        if (config.error) {
          config.error(code);
        }
      };
      
      if (config.spin) {
        this.spin(true);
      }
      
      $.ajax({
        url: '/api/' + config.method,
        data: config.content,
        type: 'POST',
        success: function(data) {          
          if (!data || data.code != 'success') {
            handleError(data && data.code ? data.code : 'failure');
          }
          
          if (config.success) {
            config.success(data);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          handleError(errorThrown || textStatus || 'error');
        },
        complete: function() {
          if (config.spin) {
            self.spin(false);
          }
        }
      });
    },
    
    // ----------
    error: function(text) {
      /*globals alert */
      alert(text);
    },

    // ----------
    loggedIn: function() {
      return !!this.server.data.username;
    },
    
    // ----------
    logIn: function(config) {
      var self = this;

      config = config || {};
      var $login = $('.login');
      
      if (config.prompt) {
        $login.find('.prompt')
          .text(config.prompt)
          .show();
      }
      
      var twitterUrl = "";
      this.request({
        method: "get-twitter-url",
        spin: true,
        success: function(data) {
          twitterUrl = data.url;
          $login.show();
        }, 
        error: function() {
          self.error('Unable to get login URL');
        }
      });
    
      this.$twitter = $(".twitter")
        .click(function() {
          window.open(twitterUrl, "_blank", "width=700,height=500");
          var interval = setInterval(function() {
            if (mob.server.data.username) {
              clearInterval(interval);
              self.showLoggedIn();
              $login.hide();
              if (config.callback) {
                config.callback();
              }
              self._publish('loggedIn');
            }
          }, 500);
        });
    },
    
    // ----------
    showLoggedIn: function() {
      this.$user
        .text(mob.server.data.username);

      $('<a href="#">Sign Out</a>')
        .click(function(event) {
          event.preventDefault();
          location.href = '/logout';
        })
        .appendTo(this.$user);
    }
  }, zot.subscribable);
  
  // ----------
  $(document).ready(function() {
    mob.init();
  });
  
})();