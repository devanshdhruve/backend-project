import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  page = Math.max(1, parseInt(page, 10));
  limit = Math.max(1, parseInt(limit, 10));

  const video = await Video.findById(videoId).select("_id");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const options = {
    page,
    limit,
  };

  const comments = await Comment.aggregate([
    {
      $match: {
        video: mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $unwind: "$createdBy",
    },
    {
      $project: {
        content: 1,
        createdBy: 1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments retrieved"));
});

const addComment = asyncHandler(async (req, res) => {
  // add a comment to a video

  //1. get the video id from the request
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user?._id;

  //2 check if it is valid
  if (!content) {
    throw new ApiError(400, "Comment content is missing");
  }

  const video = await Video.findById(videoId).select("_id");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //create comment
  const comment = await Comment.create({
    content,
    owner: user,
    video: videoId,
  });

  if (!comment) {
    throw new ApiError(500, "Comment could not be created");
  }

  return res.status(200).json(new ApiResponse(200, comment, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  //1get the comment id and content from the request
  const { commentId } = req.params;
  const { content } = req.body;
  const user = req.user?._id;

  //2. check if the content is valid and the owner is the one updating
  if (!content) {
    throw new ApiError(400, "Comment content not found");
  }

  const originalComment = await Comment.findById(commentId);
  if (!originalComment) {
    throw new ApiError(404, "Comment not found");
  }

  if (originalComment.owner.toString() !== user.toString()) {
    throw new ApiError(403, "You are not allowed to update/change the comment");
  }

  //3. update the comment
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Comment could not be updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // delete a comment
  //1. get the comment id from request and body
  const { commentId } = req.params;
  const user = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  //2. check if the owner is the one deleting the comment
  if (comment.owner.toString() !== user.toString()) {
    throw new ApiError(403, "You are not allowed to delete this comment");
  }

  //3. delete the comment
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw new ApiError(500, "Comment could not be deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
