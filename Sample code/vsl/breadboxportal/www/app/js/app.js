/// <reference path="../../../typings/angularjs/angular.d.ts" />
angular.module('breadbox', ['ionic', 'breadbox.controllers', 'breadbox.services'])
    .run(function ($ionicPlatform, $http) {
    // Get the JWT from the parent window and set the default HTTP auth header
    var search = window.parent.location.search;
    search = search.substring(1);
    var params = search.split("&");
    var token;
    params.forEach(function (item) {
        if (item.indexOf("access_token=") === 0) {
            token = item.substring(13);
        }
    });
    console.log("drdavew token: " + token);
    if (token) {
        $http.defaults.headers.common.Authorization = "Bearer " + token;
    }
    $ionicPlatform.ready(function () {
    });
})
    .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('shoppinglist', {
        url: '/shoppinglist',
        cache: false,
        templateUrl: 'shopping.html',
        controller: "shoppinglist"
    })
        .state('employee', {
        cache: false,
        url: '/employee',
        templateUrl: 'employee.html',
        controller: "employee"
    })
        .state('login', {
        url: '/login',
        templateUrl: 'login.html',
        controller: "login"
    })
        .state('po-login', {
        cache: false,
        url: '/pologin',
        templateUrl: 'pologin.html',
        controller: 'POLoginController'
    })
        .state('purchase-orders', {
        url: '/purchase-orders',
        templateUrl: 'polist.html',
        controller: 'POListController',
        cache: false
    })
        .state('purchase-orders-details', {
        cache: false,
        url: '/purchase-orders/:POID',
        templateUrl: 'podetail.html',
        controller: 'PODetailController'
    });
    $urlRouterProvider.otherwise('/login');
});
angular.element(document).ready(function () {
    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');
    $http.get('config/APP_CONFIG.json').then(function (response) {
        angular.module('breadbox').constant("APP_CONFIG", response.data);
        angular.bootstrap(angular.element(document).find('body'), ['breadbox']);
    });
});
var ShoppingList;
(function (ShoppingList) {
    var Item = (function () {
        function Item(obj, name) {
            if (obj && obj.name) {
                this.name = obj.name;
            }
            else if (name) {
                this.name = name;
            }
            if (obj && obj.checked) {
                this.checked = obj.checked;
            }
            if (obj && obj.image) {
                this.image = obj.image;
            }
            this.decoration = this.getDecoration();
        }
        //Returns whether the item should be striked through.
        Item.prototype.getDecoration = function () {
            if (this.checked) {
                return "line-through";
            }
            else {
                return "none";
            }
        };
        Item.prototype.compress = function () {
            return { "name": this.name, "checked": this.checked, "image": this.image };
        };
        return Item;
    }());
    ShoppingList.Item = Item;
})(ShoppingList || (ShoppingList = {}));
/// <reference path="Item.ts" />
var ShoppingList;
(function (ShoppingList) {
    var List = (function () {
        function List(arr) {
            this.items = [];
            if (!arr) {
                return;
            }
            for (var i = 0; i < arr.length; i++) {
                arr[i].getDecoration = ShoppingList.Item.prototype.getDecoration;
                this.items.push(new ShoppingList.Item(arr[i], null));
            }
            ;
        }
        //Adds an new item to the list. Returns length of array.
        List.prototype.add = function (item) {
            return this.items.unshift(item);
        };
        List.prototype.concat = function (items) {
            this.items.concat(items);
            this.items.forEach(function (element) {
                element.getDecoration = ShoppingList.Item.prototype.getDecoration;
            }, this);
        };
        List.prototype.contains = function (name) {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].name == name) {
                    return true;
                }
            }
            return false;
        };
        //Returns the length of the list.
        List.prototype.count = function () {
            return this.items.length;
        };
        //Returns the items array.
        List.prototype.getItems = function () {
            return this.items;
        };
        //Goes through array and counts number of checked items.
        List.prototype.numberChecked = function () {
            return this.items.filter(function (item) {
                return item.checked;
            }).length;
        };
        //Removes an item from the list.
        List.prototype.remove = function (item) {
            var i = this.items.indexOf(item);
            this.items.splice(i, 1);
        };
        List.prototype.removeAll = function () {
            this.items = [];
        };
        //Removes all the checked items from the list.
        List.prototype.removeChecked = function () {
            this.items = this.items.filter(function (item) {
                return !item.checked;
            });
        };
        return List;
    }());
    ShoppingList.List = List;
})(ShoppingList || (ShoppingList = {}));
var ShoppingList;
(function (ShoppingList) {
    var Suggestion = (function () {
        function Suggestion(num, itemName, reason) {
            this.name = itemName;
            this.id = num;
            this.reason = reason;
        }
        return Suggestion;
    }());
    ShoppingList.Suggestion = Suggestion;
})(ShoppingList || (ShoppingList = {}));
/// <reference path="ShoppingList/List.ts" />
/// <reference path="ShoppingList/Suggestion.ts" />
/// <reference path="../../../typings/angularjs/angular.d.ts" />
var app = angular.module("breadbox.controllers", []);
app.controller("shoppinglist", function ($scope, $http, $ionicPopup, Items, Suggestions, ListManager, User, APP_CONFIG) {
    $scope.id = User.username;
    $scope.rev = '';
    $scope.visibility = "none";
    $scope.hasRecommended = true;
    $scope.removeButton = document.getElementById("removeButton");
    $scope.suggestions = [];
    $scope.visibility = "inline-block";
    $scope.removeButton.style.visibility = "collapse";
    $scope.showKeyboard = function() {
    	//alert("Hello, world!");
    };
    $scope.addItem = function () {
        var box = document.getElementById("addInput");
        if (box.value) {
            var item = new ShoppingList.Item(null, box.value);
            box.value = "";
            $scope.list.add(item);
        }
        $scope.visibility = "inline-block";//"none";
        //$scope.removeButton.style.visibility = "visible";
        ListManager.uploadList($scope.id, $scope.list);
    };
    $scope.addRecommended = function (suggested) {
        var i = $scope.suggestions.indexOf(suggested);
        $scope.suggestions.splice(i, 1);
        $scope.list.items.unshift(new ShoppingList.Item(null, suggested.name));
        if ($scope.suggestions.length === 0) {
            $scope.hasRecommended = false;
        }
        ListManager.uploadList($scope.id, $scope.list);
    };
    //Called when user swipes left on an item.Removes the item from the list.
    $scope.removeItem = function (item, $event) {
        $scope.list.remove(item);
        if ($scope.list.count() < 1) {
            $scope.visibility = "none";
        }
        ListManager.uploadList($scope.id, $scope.list);
    };
    $scope.removeChecked = function () {
        $scope.list.removeChecked();
        if ($scope.list.count() < 1) {
            $scope.visibility = "none";
        }
        else {
            $scope.hideDelete();
        }
        ListManager.uploadList($scope.id, $scope.list);
    };
    $scope.removeAll = function () {
        $scope.removeAllConfirm();
    };
    //Handles the checkbox being tapped.
    $scope.checked = function (item) {
        item.decoration = item.getDecoration();
        ListManager.uploadList($scope.id, $scope.list);
    };
    $scope.removeAllConfirm = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Remove all items.',
            template: 'Are you sure you want to remove all items from the list?',
            buttons: [
                { text: 'No' }, { text: "Yes", type: "button-assertive", onTap: function () { return true; } }]
        });
        confirmPopup.then(function (res) {
            if (res) {
                $scope.list.removeAll();
                Items.clear();
                ListManager.uploadList($scope.id, $scope.list);
                $scope.visibility = "none";
            }
            else {
            }
        });
    };
    $scope.removeButtonClick = function () {
        $scope.visibility = "inline-block";
        $scope.removeButton.style.visibility = "collapse";
    };
    $scope.hideDelete = function ($event) {
//        $scope.visibility = "none";
//        $scope.removeButton.style.visibility = "visible";
        var addInput = document.getElementById("addInput");
    };
    $scope.downloadSuggestions = function () {
        $http.get(APP_CONFIG.listService + "/recommendationList")
            .success(function (data, status, headers, config) {
            var arr = data["recom"];
            for (var i = 0; i < arr.length; i++) {
                var sugg = new ShoppingList.Suggestion(arr[i].id, arr[i].name, arr[i].reason);
                if (!$scope.list.contains(sugg.name)) {
                    Suggestions.add(sugg);
                }
            }
            $scope.suggestions = Suggestions.topFiltered($scope.list);
        })
            .error(function (data, status, headers, config) {
            console.log("Error getting suggestions");
        });
    };
    $scope.updateList = function () {
        $scope.list = new ShoppingList.List(Items.all());
    };
    //$scope.loadItems();
    $scope.updateList();
    $scope.downloadSuggestions(); //Move to service.
});
app.controller("personal", function ($scope, $state, Items, ListManager, User) {
    $scope.name = User.realname;
    $scope.points = User.breadpoints;
    $scope.go = function (where) {
        $state.go(where);
    };
    ListManager.downloadList(User.username, $scope.updateList);
});
app.controller("employee", function ($scope, $state, User, Items, ListManager) {
    $scope.name = User.realname;
    $scope.points = User.breadpoints;
    ListManager.downloadList(User.username, $scope.updateList);
});
app.controller("login", function ($scope, $state, $ionicLoading, $ionicHistory, $ionicPopup, $http, User, APP_CONFIG) {
    $scope.registering = false;
    $scope.loading = false;
    $scope.submitText = "Submit";
    $scope.registerText = "Need an account? Register now!";
    $scope.setUser = function (data) {
        User.username = data["_id"];
        User.realname = data["realname"];
        User.customerid = data["customerid"];
        User.breadpoints = data["breadpoints"];
        $scope.loading = false;
    };
    $scope.getUser = function () {
        var url = APP_CONFIG.listService + "/userDetail";
    console.log("drdavew list user detail url: " + url);
        $scope.loading = true;
        $ionicLoading.show({ template: 'Logging in ...' });
        $http.get(url)
            .success(function (data, status, headers, config) {
            $ionicLoading.hide();
            $scope.setUser(data);
            $state.go("employee");
        })
            .error(function (data, status, headers, config) {
            $ionicLoading.hide();
            $scope.showAlert("Failed to login", "Please try again later.");
            $scope.loading = false;
        });
    };
    $scope.showAlert = function (messTitle, message) {
        $scope.buttonDisabled = true;
        var alertPopup = $ionicPopup.alert({
            title: messTitle,
            template: message
        });
        alertPopup.then(function (res) {
            $scope.buttonDisabled = false;
        });
    };
    $scope.getUser();
});
/// <reference path="ShoppingList/List.ts" />
/// <reference path="ShoppingList/Suggestion.ts" />
/// <reference path="../../../typings/angularjs/angular.d.ts" />
var Suggestion = ShoppingList.Suggestion;
var List = ShoppingList.List;
var app = angular.module("breadbox.services", []);
app.factory('Items', function () {
    var items = [];
    return {
        all: function () {
            return items;
        },
        save: function (list) {
            items = list;
        },
        createAndSave: function (arr) {
            var list = new List(arr);
            items = list.getItems();
        },
        clear: function () {
            items = [];
        }
    };
})
    .factory('Suggestions', function () {
    var suggestions = [];
    return {
        all: function () {
            return suggestions;
        },
        top: function () {
            return suggestions.slice(0, 2);
        },
        add: function (element) {
            suggestions.push(element);
        },
        topFiltered: function (items) {
            var arr = [];
            for (var i = 0; i < suggestions.length && arr.length < 2; i++) {
                if (!items.contains(suggestions[i].name)) {
                    arr.push(suggestions[i]);
                }
            }
            return arr;
        }
    };
});
app.service('User', function () {
    this.realname = "null";
    this.username = "";
    this.breadpoints = 0;
    this.customerid = 0;
});
app.service('ListManager', function ($http, Items, APP_CONFIG) {
    this.downloadList = function (id, callback) {
        console.log("id: " + id);
        $http.get(APP_CONFIG.listService + "/shoppingList")
            .success(function (data, status, headers, config) {
            Items.createAndSave(data["list"]);
            List.rev = data["_rev"];
            if (callback) {
                callback();
            }
        })
            .error(function (data, status, headers, config) {
            console.log(status + " - error getting shopping list");
        });
    };
    this.compress = function (list) {
        Items.save(list);
        var arr = Items.all()["items"];
        var arr2 = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].compress) {
                arr2.push(arr[i].compress());
            }
        }
        return arr2;
    };
    this.uploadList = function (id, list) {
        console.log(id + "  " + List.rev);
        var arr = this.compress(list);
        var opt = {
            url: APP_CONFIG.listService + "/shoppingList",
            body: { _rev: List.rev, list: arr }
        };
        console.log("LOG:" + JSON.stringify(opt.body));
        $http.put(opt.url, opt.body)
            .success(function (data, status, headers, config) {
            if (data["rev"]) {
                List.rev = data["rev"];
            }
        })
            .error(function (data, status, headers, config) {
            console.log("error getting list." + status + " , " + data);
        });
    };
});
//# sourceMappingURL=app.js.map
