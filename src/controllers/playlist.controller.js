import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Please provide name and description");
  }

  const createPlaylist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user?._id,
  });

  if (!createPlaylist) {
    throw new ApiError(400, "Could not create the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(400, createPlaylist, "Created the playlist successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const userPlaylist = await Playlist.find({
    owner: userId,
  });

  if (!userPlaylist) {
    throw new ApiError(400, "Cannot find user playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "User playlist is here!"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist Id is invalid");
  }

  const findPlaylist = await Playlist.findById(playlistId);

  if (!findPlaylist) {
    throw new ApiError(400, "Could not find the Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, findPlaylist, "Playlist found"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) && !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invaid videoId or PlaylistId");
  }

  const findPlaylist = await Playlist.findById(playlistId);

  if (!playlistId) {
    throw new ApiError(400, "Could not find the playlist");
  }

  if (!findPlaylist.owner.equals(req.user?._id)) {
    throw new ApiError(400, "You cannot do any changes in the Playlist");
  }

  if (findPlaylist.video.equals(videoId)) {
    throw new ApiError(400, "video is already in the playlist");
  }

  findPlaylist.video.push(videoId);
  const videoAdded = await findPlaylist.save();

  if (!videoAdded) {
    throw new ApiError(400, "Could not add the video due to some error");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoAdded,
        "Successfully added video to the playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Playlist id or Video Id");
  }

  const findVideo = await Playlist.findOne({
    $and: [
      {
        _id: playlistId,
      },
      {
        video: videoId,
      },
    ],
  });

  if (!findVideo) {
    throw new ApiError(400, "Video does not exists in the playlist");
  }

  if (!findVideo.owner.equals(req.user?._id)) {
    throw new ApiError(400, "cannot update the playlist");
  }

  findVideo.video.pull(videoId);
  const videoRemoved = await findVideo.save();

  if (!videoRemoved) {
    throw new ApiError(400, "Unable to remove the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoRemoved, "Successfully removed the video"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const findPlaylist = await Playlist.findById(playlistId);
  if (!findPlaylist) {
    throw new ApiError(500, "Cannot find the playlist");
  }

  if (!findPlaylist.owner.equals(req.user?._id)) {
    throw new ApiError(500, "Cannot do any changes in the playlist");
  }

  const removePlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!removePlaylist) {
    throw new ApiError(500, "Unable to delete the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, removePlaylist, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (!name || !description) {
    throw new ApiError(400, "Please provide name and description");
  }

  const findPlaylist = await Playlist.findById(playlistId);
  if (!findPlaylist) {
    throw new ApiError(400, "Unable to find the playlist");
  }

  if (!findPlaylist.owner.equals(req.user?._id)) {
    throw new ApiError(400, "Can not do any changes in playlists");
  }

  findPlaylist.name = name;
  findPlaylist.description = description;

  const updatedPlaylist = await findPlaylist.save();
  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "Unable to update the changes now, try again later"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
