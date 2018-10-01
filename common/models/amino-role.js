'use strict';

function afterRoleAddRemoveToDatabase(ctx, next) {
  global.postal.publish({
    channel: 'PostalChannel-Authentication',
    topic: 'AfterRoleAddRemoveToDatabase',
    data: {
      ctx,
      next
    }
  });
}

module.exports = function(AminoRole) {
  //Observe DB events
  AminoRole.observe('after save', (ctx, next) => {
    afterRoleAddRemoveToDatabase(ctx, next);
  });
  AminoRole.observe('after delete', (ctx, next) => {
    afterRoleAddRemoveToDatabase(ctx, next);
  });
};
