'use strict';

module.exports = function (LongRunningTask) {
  LongRunningTask.observe('after save', (ctx, next) => {
    global.postal.publish({
      channel: 'PostalChannel-DataSetLaunchEtl',
      topic: 'AfterLongRunningTaskSave',
      data: {
        ctx,
        next
      }
    });
  });
};
