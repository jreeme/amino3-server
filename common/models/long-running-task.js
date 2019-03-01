'use strict';

module.exports = function (LongRunningTask) {
  LongRunningTask.observe('before save', (ctx, next) => {
    global.postal.publish({
      channel: 'PostalChannel-DataSetLaunchEtl',
      topic: 'BeforeLongRunningTaskSave',
      data: {
        ctx,
        next
      }
    });
  });
};
