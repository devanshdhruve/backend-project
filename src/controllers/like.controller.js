import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video not available");
  }

  const videoLike = await Like.findOne({
    $and: [
      {
        likedBy: req.user?._id,
      },
      {
        video: videoId,
      },
    ],
  });

  if (videoLike) {
    const unLike = await Like.findByIdAndDelete(videoLike._id);

    return res.status(200, unLike, "Video Unliked successfully");
  }

  const Liked = await Like.create({
    likedBy: req.user?._id,
    video: videoId,
  });

  return json
    .status(200)
    .json(new ApiResponse(200, Liked, "Liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const commentLike = await Like.findOne({
    $and: [
      {
        likedBy: req.user?._id,
      },
      {
        comment: commentId,
      },
    ],
  });

  if (commentLike) {
    const unLike = await Like.findByIdAndDelete(commentLike._id);

    return res.status(400, unLike, "Comment like deleted");
  }

  const Liked = await Like.create({
    likedBy: req.user?._id,
    comment: commentId,
  });

  return json.status(200).json(200, Liked, "Comment Liked Successfully");
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const tweetLike = await Like.findOne({
    $and: [
      {
        likedBy: req.user?._id,
      },
      {
        tweet: tweetId,
      },
    ],
  });

  if (tweetLike) {
    const unLike = await Like.findByIdAndDelete(tweetLike._id);

    return res.status(400, unLike, "Tweet like deleted");
  }

  const Liked = await Like.create({
    likedBy: req.user?._id,
    tweet: tweetId,
  });

  return res.status(200).json(200, Liked, "Tweet Liked Successfully");
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const LikedVideo = await Like.find({
    $and: [
      {
        likedBy: req.user?._id,
      },
      {
        video: {
          $exists: true,
        },
      },
    ],
  });

  if (!LikedVideo) {
    throw new ApiError(400, "Liked Video not found");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        Total_Videos: LikedVideo.length,
        Videos: LikedVideo,
      },
      "Videos Found"
    )
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
