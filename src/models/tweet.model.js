import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Likes",
      },
    ],
  },
  { timestamps: true }
);

export const Tweets = mongoose.model("Tweets", tweetSchema);
