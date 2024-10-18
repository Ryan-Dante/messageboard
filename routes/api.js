'use strict';

const mongoose = require('mongoose');
const ThreadSchema = require('../models/Thread.js');
const BoardSchema = require('../models/Board.js');

module.exports = function (app) {

  // Threads routes
  app.route('/api/threads/:board')

    // POST a new thread
    .post(async (req, res) => {
      try {
        let board = req.params.board;
        const { text, delete_password } = req.body;

        // Check board
        if (!board) {
          board = req.body.board;
        }

        const newThread = new ThreadSchema({
          text: text,
          delete_password: delete_password,
          replies: [],
        });

        // Create a new board if it doesn't exist
        try {
          let data = await BoardSchema.findOne({ name: board });
          if (!data) {
            const newBoard = new BoardSchema({
              name: board,
              threads: [],
            });
            await newBoard.save();
          }
        } catch (err) {
          console.log(err);
        }

        // Add the thread to the board's threads array
        let thread = await newThread.save();
        let boardData = await BoardSchema.findOne({ name: board });
        if (!boardData) {
          const newBoard = new BoardSchema({
            name: board,
            threads: [],
          });
          console.log('New board created', newBoard);
          newBoard.threads.push(newThread);
          await newBoard.save();
        } else {
          boardData.threads.push(newThread);
          await boardData.save();
        }
        res.json(thread);
      } catch (err) {
        console.log(err);
        res.status(500).send('Error posting thread');
      }
    })

    // View the 10 most recent threads with 3 replies each, excluding reported and delete_password fields
    .get(async (req, res) => {
      try {
        const board = req.params.board;

        // Find the board and populate its threads
        let boardData = await BoardSchema.findOne({ name: board })
          .populate({
            path: 'threads',
            options: { sort: { bumped_on: -1 }, limit: 10 }, // Get 10 most recent threads
            populate: {
              path: 'replies',
              match: { reported: false }, // Only include non-reported replies
              select: '-delete_password -reported', // Exclude sensitive fields in replies
              options: { sort: { created_on: -1 }, limit: 3 } // Limit to 3 most recent replies
            },
            select: '-delete_password -reported' // Exclude sensitive fields at thread level
          });

        if (!boardData) {
          return res.status(404).send('Board not found');
        }

        // Map threads to structure the response
        const threads = boardData.threads.map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          })), // Exclude 'delete_password' in mapped replies
          replycount: thread.replies.length
        }));

        res.json(threads);
      } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching threads');
      }
    })

    // PUT Report a thread
    .put(async (req, res) => {
      let board = req.params.board;
      let thread_id = req.body.thread_id;

      if (!board) {
        return res.send('Board not found');
      }

      console.log('Reporting thread', thread_id);
      try {
        let data = await ThreadSchema.findByIdAndUpdate(thread_id, { reported: true }, { new: true });
        if (!data) {
          return res.send('Thread not found');
        }
        res.send('reported');
      } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
      }
    })

    // DELETE a thread
    .delete(async (req, res) => {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;

      if (!board) {
        return res.send('Board not found');
      }

      try {
        let thread = await ThreadSchema.findById(thread_id);
        if (!thread) {
          return res.send('Thread not found');
        }

        if (thread.delete_password === delete_password) {
          await ThreadSchema.findOneAndDelete({ _id: thread_id });
          return res.send('success');
        } else {
          return res.send('incorrect password');
        }
      } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
      }
    }
    );

  // Replies routes
  app.route('/api/replies/:board')
    // Post a reply for a thread
    .post(async (req, res) => {
      try {
        const { text, delete_password, thread_id } = req.body;

        // Check if the thread_id, text, and delete_password are provided
        if (!thread_id || !text || !delete_password) {
          return res.status(400).send('Missing required fields');
        }

        // Find the thread by ID
        let thread = await ThreadSchema.findById(thread_id);
        if (!thread) {
          return res.status(404).send('Thread not found');
        }

        console.log(thread);

        // Create a new reply object
        let newReply = {
          _id: new mongoose.Types.ObjectId(),
          text: text,
          delete_password: delete_password,
          created_on: new Date(),
          reported: false,
        };

        // Add the reply to the thread's replies array
        thread.replies.push(newReply);

        // Update the thread's bumped_on date
        thread.bumped_on = newReply.created_on;

        // Save the updated thread
        await thread.save();

        // Respond with the new reply object or just a success message
        console.log('Reply posted');
        res.json(newReply);
      } catch (err) {
        console.log(err);
        res.status(500).send('Error posting reply');
      }
    })

    // Get a thread with all replies
    .get(async (req, res) => {
      try {
        const { thread_id } = req.query;

        // Ensure thread_id is received
        if (!thread_id) {
          return res.status(400).send('Missing thread_id');
        }

        // Find the thread (no need for population since replies are embedded)
        let thread = await ThreadSchema.findById(thread_id)
          .select('-delete_password -reported -replies.delete_password -replies.reported');

        if (!thread) {
          return res.status(404).send('Thread not found');
        }

        res.json(thread);
      } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching replies');
      }
    })

    // Report a reply
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;

        // Check if both thread_id and reply_id are provided
        if (!thread_id || !reply_id) {
          return res.status(400).send('Missing thread_id or reply_id');
        }

        // Find the thread by ID
        let thread = await ThreadSchema.findById(thread_id);
        if (!thread) {
          return res.status(404).send('Thread not found');
        }

        // Find the reply by ID within the thread's replies array
        let reply = thread.replies.id(reply_id);
        if (!reply) {
          return res.status(404).send('Reply not found');
        }

        // Update the reported field of the reply
        reply.reported = true;
        await thread.save(); // Save the updated thread

        res.send('reported');
      } catch (err) {
        console.error(err);
        return res.status(500).send('Error reporting reply');
      }
    })

    // DELETE a reply
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;

        // Validate required fields
        if (!thread_id || !reply_id || !delete_password) {
          return res.status(400).send('Missing thread_id, reply_id, or delete_password');
        }

        // Find the thread by ID
        let thread = await ThreadSchema.findById(thread_id);
        if (!thread) {
          return res.status(404).send('Thread not found');
        }

        // Find the reply by ID within the thread's replies array
        let reply = thread.replies.id(reply_id);
        if (!reply) {
          return res.status(404).send('Reply not found');
        }

        // Check if the password matches
        if (reply.delete_password === delete_password) {
          reply.text = '[deleted]'; // Mark the reply as deleted
          await thread.save(); // Save the updated thread
          return res.send('success');
        } else {
          return res.send('incorrect password');
        }
      } catch (err) {
        console.error(err);
        return res.status(500).send('Error deleting reply');
      }
    });

};
