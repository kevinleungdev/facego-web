const Sequelize = require('sequelize');
const config = require('./config.json')

var DB_INSTANCE = null;

module.exports = {
    getInstance: function() {
        if (DB_INSTANCE === null) {
            DB_INSTANCE = new Sequelize(config.db.name, config.db.user, config.db.password, {
                dialect: config.db.type,
                host: config.db.host,
                port: config.db.port,
                timezone: '+00:00'
            });
        }
        return DB_INSTANCE;
    },

    testConnection: function() {
        var db = this.getInstance();

        // 进行数据库连接测试
        db.authenticate()
          .then(() => {
            console.log('Connection has been established successfully.');
          })
          .catch(err => {
            console.error('Unable to connect to the database:', err);
          });
    }
}
