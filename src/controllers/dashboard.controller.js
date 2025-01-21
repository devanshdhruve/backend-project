import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Likes } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  let { channel } = req.body;

  channel = await User.findOne({ username: channel });
  if (!channel) {
    throw new ApiError(400, "Channel not found");
  }

  const channelID = new mongoose.Types.ObjectId(channel?._id);

  if (!isValidObjectId(channelID)) {
    throw new ApiError(400, "Channel Id is not valid");
  }

  const totalViewsAndVideos = await Video.aggregate([
    {
      $match: {
        $and: [
          {
            Owner: new mongoose.Types.ObjectId(channelID),
          },
          {
            isPulished: true,
          },
        ],
      },
    },
    {
      $group: {
        _id: "$Owner",
        totalViews: {
          $sum: "$views",
        },
        totalVideos: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalSubs = await Subscription.aggregate([
    {
      $match: {
        Owner: new mongoose.Types.ObjectId(channelID),
      },
    },
    {
      $count: "totalSubscribers",
    },
  ]);

  const totalTweets = await Tweets.aggregate([
    {
      $match: {
        Owner: new mongoose.Types.ObjectId(channelID),
      },
    },
    {
      $count: "totalTweets",
    },
  ]);

  const totalComments = await Comment.aggregate([
    {
      $match: {
        Owner: new mongoose.Types.ObjectId(),
      },
    },
    {
      $count: "totalComments",
    },
  ]);

  const totalVideoLikes = await Likes.aggregate([
    {
      $match: {
        $and: [
          {
            likedBy: new mongoose.Types.ObjectId(channelID),
          },
          {
            video: {
              $exists: true,
            },
          },
        ],
      },
    },
    {
      $count: "totalVideoLikes",
    },
  ]);

  const totalCommentLikes = await Likes.aggregate([
    {
      $match: {
        $and: [
          { likedBy: new mongoose.Types.ObjectId(channelID) },
          { Comment: { $exists: true } },
        ],
      },
    },
    { $count: "totalCommentLikes" },
  ]);

  const totalTweetLikes = await Likes.aggregate([
    {
      $match: {
        $and: [
          { likedBy: new mongoose.Types.ObjectId(channelID) },
          { tweet: { $exists: true } },
        ],
      },
    },
    { $count: "totalTweetLikes" },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalViews: totalViewsAndVideos[0]?.totalViews,
        totalVideos: totalViewsAndVideos[0]?.totalVideos,
        totalSubs: totalSubs[0]?.totalSubcribers,
        totalTweets: totalTweets[0]?.totalTweets,
        totalComments: totalComments[0]?.totalComments,
        totalVideoLikes: totalVideoLikes[0]?.totalVideoLikes,
        totalCommentLikes: totalCommentLikes[0]?.totalCommentLikes,
        totalTweetLikes: totalTweetLikes[0]?.totalTweetLikes,
      },
      "Stats of the chanel"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelID } = req.body;

  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(channelID)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  let pipeline = [
    {
      $match: {
        $and: [
          {
            Owner: new mongoose.Types.ObjectId(channelID),
          },
          {
            isPulished: true,
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "Owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $addFields: {
        username: "$ownerDetails.username",
        fullName: "$ownerDetails.fullName",
        avatar: "$ownerDetails.avatar",
      },
    },
    {
      $project: {
        ownerDetails: 0,
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabel: {
      totalDocs: "total_videos",
      docs: "Videos",
    },
  };

  const videos = await Video.aggregatePaginate(pipeline, options);

  if (videos?.total_videos === 0) {
    throw new ApiError(400, "Videos Not Found");
  }

  return res.status(200).json(new ApiResponse(200, { videos }, "Videos Found"));
});

export { getChannelStats, getChannelVideos };
