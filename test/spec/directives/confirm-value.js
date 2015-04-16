'use strict';

describe('Directive: confirmValue', function () {

  // load the directive's module
  beforeEach(module('wblwrld3App'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<confirm-value></confirm-value>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the confirmValue directive');
  }));
});
