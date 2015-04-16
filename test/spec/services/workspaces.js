'use strict';

describe('Service: workspaces', function () {

  // load the service's module
  beforeEach(module('wblwrld3App'));

  // instantiate service
  var workspaces;
  beforeEach(inject(function (_workspaces_) {
    workspaces = _workspaces_;
  }));

  it('should do something', function () {
    expect(!!workspaces).toBe(true);
  });

});
