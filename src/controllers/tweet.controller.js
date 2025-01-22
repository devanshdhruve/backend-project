import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Write some Tweet!");
  }

  const postTweet = await Tweet.create({
    owner: req.user?._id,
    content: content,
  });

  if (!postTweet) {
    throw new ApiError(400, "Tweet not Posted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, postTweet, "Tweet Posted Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // Get user tweets
  const { userId } = req.params;

  // Validate userId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  // Find tweets for the user
  const totalTweet = await Tweet.find({ owner: userId });

  // Return if no tweets are found
  if (totalTweet.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { Total_Tweets: 0, Tweet: [] },
          "No tweets found for the user."
        )
      );
  }

  // Success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { Total_Tweets: totalTweet.length, Tweet: totalTweet },
        "Tweets found!"
      )
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Please write something!");
  }

  // 2. find the tweet by tweetId and req.user._id. // only owner can update the tweet
  const findTweet = await Tweet.findOne({
    owner: req.user?._id,
    _id: tweetId,
  });

  if (!findTweet) {
    throw new ApiError(400, "You are not authorized to update this tweet");
  }

  // 3. update the tweet content and save it to the database
  findTweet.content = content;
  const updatedTweet = await findTweet.save();

  if (!updatedTweet) {
    throw new ApiError(500, "Tweet not updated!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  // Extract tweetId from URL params
  const { tweetId } = req.params;

  // Validate tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  // Check if the user is the owner of the tweet
  const findTweet = await Tweet.findOne({
    owner: req.user?._id, // Check if the owner matches the logged-in user
    _id: tweetId, // Match the tweet ID
  });

  if (!findTweet) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  // Delete the tweet
  const delTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!delTweet) {
    throw new ApiError(500, "Failed to delete the tweet");
  }

  // Respond with success
  return res
    .status(200)
    .json(new ApiResponse(200, delTweet, "Tweet deleted successfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
