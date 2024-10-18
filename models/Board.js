const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Thread = require('./Thread');

const BoardSchema = new Schema({
    name: { type: String, required: true },
    threads: [{ type: Schema.Types.ObjectId, ref: Thread }]
    });

    module.exports = mongoose.model('Board', BoardSchema);