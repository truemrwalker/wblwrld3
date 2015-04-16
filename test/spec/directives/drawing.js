'use strict';

describe('Directive: drawing', function () {

  // load the directive's module
  beforeEach(module('wblwrld3App'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<drawing></drawing>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the drawing directive');
  }));
});
