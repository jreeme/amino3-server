var loopback = require('loopback');
var ds = loopback.createDataSource('postgres', {
  "host": "localhost",
  "port": 5432,
  "url": "postgres://northwind_user:thewindisblowing@localhost/northwind",
  "database": "northwind",
  "user": "northwind_user",
  "connector": "postgresql",
  "password": "thewindisblowing"
});

ds.discoverModelDefinitions({views: false, limit: 100}, (err, tables) => {
  tables.forEach((table) => {
    let tableName = table.name;
    //ds.discoverAndBuildModels(tableName, {visited: {}, associations: true},
    /*  tableName,
        {visited: {}, associations: true},*/
    ds.discoverSchemas(
      tableName,
      {relations: true, all: true, views: true},
      (err, models) => {
        let e = err;
      });
  });
});
/*
ds.discoverAndBuildModels('INVENTORY', {visited: {}, associations: true},
function (err, models) {
  // Now we have a list of models keyed by the model name
  // Find the first record from the inventory
  models.Inventory.findOne({}, function (err, inv) {
    if(err) {
      console.error(err);
      return;
    }
    console.log("\nInventory: ", inv);
    // Navigate to the product model
    // Assumes inventory table has a foreign key relationship to product table
    inv.product(function (err, prod) {
      console.log("\nProduct: ", prod);
      console.log("\n ------------- ");
    });
  });
});*/
