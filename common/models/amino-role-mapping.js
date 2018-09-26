'use strict';

function afterRoleMappingAddRemoveToDatabase(ctx, next, ignoreDbTriggers) {
  if (ignoreDbTriggers) {
    return next();
  }
  global.postal.publish({
    channel: 'PostalChannel-Authentication',
    topic: 'AfterRoleMappingAddRemoveToDatabase',
    data: {
      ctx,
      next
    }
  });
}

module.exports = function (AminoRoleMapping) {
  AminoRoleMapping.observe('after save', (ctx, next) => {
    afterRoleMappingAddRemoveToDatabase(ctx, next, ctx.instance.ignoreDbTriggers);
  });
  AminoRoleMapping.observe('after delete', (ctx, next) => {
    next();
    //afterRoleMappingAddRemoveToDatabase(ctx, next);
  });
};
