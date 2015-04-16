'use strict';

describe('Controller: TemplatesCtrl', function () {

  // load the controller's module
  beforeEach(module('wblwrld3App'));

  var TemplatesCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TemplatesCtrl = $controller('TemplatesCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
