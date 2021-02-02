const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const fbAuth = require("../utils/fbAuth");

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const data = await admin
      .firestore()
      .collection("posts")
      .orderBy("createdAt", "desc")
      .get();
    const posts = [];
    data.forEach(doc => {
      posts.push({
        postId: doc.id,
        body: doc.data().body,
        userHandle: doc.data().userHandle,
        createdAt: doc.data().createdAt,
        userImage: doc.data().userImage,
        likeCount: doc.data().likeCount,
        commentCount: doc.data().commentCount,
      });
    });

    return res.status(200).json({ success: true, data: posts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, msg: err.code });
  }
});

// @desc    Create new posts
// @route   POST /api/posts
// @access  Public
router.post("/", fbAuth, async (req, res, next) => {
  try {
    const { body } = req.body;

    const newPost = {
      body,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
    };

    const doc = await admin.firestore().collection("posts").add(newPost);

    const resPost = newPost;
    resPost.postId = doc.id;

    return res.status(201).json({
      success: true,
      data: resPost,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, msg: err.code });
  }
});

// @desc    Get one post with comments
// @route   GET /api/posts/:postId
// @access  Public
router.get("/:postId", async (req, res, next) => {
  try {
    let postData = {};

    const doc = await admin
      .firestore()
      .doc(`/posts/${req.params.postId}`)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, msg: "Post not found." });
    }

    postData = doc.data();

    postData.postId = doc.id;

    const data = await admin
      .firestore()
      .collection("comments")
      .orderBy("createdAt", "desc")
      .where("postId", "==", req.params.postId)
      .get();

    postData.comments = [];
    data.forEach(doc => {
      postData.comments.push(doc.data());
    });

    return res.status(200).json({ success: true, data: postData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, msg: err.code });
  }
});

// @desc    Comment on post
// @route   POST /api/posts/:postId/comment
// @access  Protected
router.post("/:postId/comment", fbAuth, async (req, res, next) => {
  try {
    if (req.body.body.trim() === "") {
      return res.status(400).json({ success: false, msg: "Must not be empty" });
    }

    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      postId: req.params.postId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl,
    };

    const doc = await admin
      .firestore()
      .doc(`/posts/${req.params.postId}`)
      .get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, msg: "Post not found." });
    }

    await doc.ref.update({ commentCount: doc.data().commentCount + 1 });

    await admin.firestore().collection("comments").add(newComment);

    return res.status(201).json({ success: true, data: newComment });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.code });
  }
});

// @desc    Like post
// @route   GET /api/posts/:postId/like
// @access  Protected
router.get("/:postId/like", fbAuth, async (req, res, next) => {
  try {
    const likeDocument = admin
      .firestore()
      .collection("likes")
      .where("userHandle", "==", req.user.handle)
      .where("postId", "==", req.params.postId)
      .limit(1);

    const postDocument = admin.firestore().doc(`/posts/${req.params.postId}`);

    let postData = {};

    const doc = await postDocument.get();

    if (doc.exists) {
      postData = doc.data();
      postData.postId = doc.id;
      const data = await likeDocument.get();
      if (data.empty) {
        // Post has not been liked by this user
        await admin.firestore().collection("likes").add({
          postId: req.params.postId,
          userHandle: req.user.handle,
        });

        postData.likeCount++;
        await postDocument.update({ likeCount: postData.likeCount });

        return res.status(200).json({ success: true, data: postData });
      } else {
        // Post has been liked by this user
        res.status(400).json({ success: false, msg: "Scream already liked" });
      }
    } else {
      res.status(404).json({ success: false, msg: "Post not found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, msg: err.code });
  }
});

// @desc    Unlike post
// @route   GET /api/posts/:postId/unlike
// @access  Protected
router.get("/:postId/unlike", fbAuth, async (req, res, next) => {
  try {
    const likeDocument = admin
      .firestore()
      .collection("likes")
      .where("userHandle", "==", req.user.handle)
      .where("postId", "==", req.params.postId)
      .limit(1);

    const postDocument = admin.firestore().doc(`/posts/${req.params.postId}`);

    let postData = {};

    const doc = await postDocument.get();

    if (doc.exists) {
      postData = doc.data();
      postData.postId = doc.id;
      const data = await likeDocument.get();
      if (data.empty) {
        // Post has been liked by this user
        res.status(400).json({ success: false, msg: "Scream not liked" });
      } else {
        // Post has not been liked by this user
        await admin.firestore().doc(`/likes/${data.docs[0].id}`).delete();

        postData.likeCount--;
        await postDocument.update({ likeCount: postData.likeCount });

        return res.status(200).json({ success: true, data: postData });
      }
    } else {
      res.status(404).json({ success: false, msg: "Post not found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: err.code });
  }
});

// @desc    Delete post
// @route   GET /api/posts/:postId
// @access  Protected
router.delete("/:postId", fbAuth, async (req, res, next) => {
  const doc = await admin.firestore().doc(`/posts/${req.params.postId}`).get();

  if (!doc.exists) {
    return res.status(404).json({ success: false, msg: "Post not found." });
  }

  if (doc.data().userHandle !== req.user.handle) {
    return res.status(403).json({ success: false, msg: "Unauthorised." });
  }

  // Delete all comments with this post ID
  const data = await admin
    .firestore()
    .collection("comments")
    .orderBy("createdAt", "desc")
    .where("postId", "==", req.params.postId)
    .get();

  data.forEach(doc => {
    admin.firestore().doc(`/comments/${doc.id}`).delete();
  });

  await admin.firestore().doc(`/posts/${req.params.postId}`).delete();

  res.status(200).json({ success: true, msg: "Post deleted successfully." });
});

module.exports = router;
