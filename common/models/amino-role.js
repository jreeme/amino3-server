'use strict';

function addRemoveRole(topic, ctx, next) {
  global.postal.publish({
    channel: 'PostalChannel-Authentication',
    topic,
    data: {
      ctx,
      next
    }
  });
}

module.exports = function (AminoRole) {
  //Observe DB events
  AminoRole.observe('after save', (ctx, next) => {
    addRemoveRole('AfterRoleAddToDatabase', ctx, next);
  });
  AminoRole.observe('before delete', (ctx, next) => {
    addRemoveRole('BeforeRoleRemoveFromDatabase', ctx, next);
  });
};
