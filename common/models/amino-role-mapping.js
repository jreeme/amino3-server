'use strict';

module.exports = function (AminoRoleMapping) {
  AminoRoleMapping.observe('after save', function initializeDataSetName(ctx, next) {
    if(ctx.instance.ignoreDbTriggers){
      return next();
    }
    global.postal.publish({
      channel: 'PostalChannel-Authentication',
      topic: 'SyncRolesAndPotentialRoles',
      data: {
        ctx,
        next
      }
    });
  });

};
