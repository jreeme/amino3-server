'use strict';

/*function afterRoleMappingAddRemoveToDatabase(ctx, next) {
  global.postal.publish({
    channel: 'PostalChannel-Authentication',
    topic: 'AfterRoleMappingAddRemoveToDatabase',
    data: {
      ctx,
      next
    }
  });
}*/

module.exports = function (AminoRoleMapping) {
  //Observe DB events
  /*  AminoRoleMapping.observe('after save', (ctx, next) => {
      afterRoleMappingAddRemoveToDatabase(ctx, next);
    });
    AminoRoleMapping.observe('after delete', (ctx, next) => {
      afterRoleMappingAddRemoveToDatabase(ctx, next);
    });*/
};
