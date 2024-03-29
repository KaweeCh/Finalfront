export interface User {
  userID: number;
  username: string;
  password: string;
  image: string;
  type: string;
  email: string;
}

export interface Register {
  username: string;
  password: string;
  email: string;
}

export interface UpdateUser {
  userID: number;
  username: string;
  password: string;
  image: string;
}

export interface imageUpload {
  imageID: number;
  url: string;
  uploadDate: Date;
  count: number;
  userID: number;
}

export interface imageUser {
  count: number;
  imageID: number;
  url: string;
  voteScore: number;
  username: string;
  userID: number;
  rankToday: number;
  rankYesterday: number;
  rankDifferent: number;
  image: string;
}

export interface ImageRandom {
  userID: number;
  imageID: number;
  url: string;
  username: string;
  count: number;
}

export interface rankID {
  imageID: number;
  rankDiff: number;
  url: string;
  username: string;
  voteScore: number;
}

export interface Vote {
  elorating: number;
  userID: number;
  imageID: number;
}

export interface Statistic {
  id: number;
  voteScore: number;
  date: Date;
  imageID: number;
}

export interface ImageCount {
  userID: number;
  image_count: number;
}

export interface User {
  userID: number;
  username: string;
  password: string;
  image: string;
  type: string;
  email: string;
}

export interface Register {
  username: string;
  password: string;
  email: string;
}

export interface UpdateUser {
  userID: number;
  username: string;
  password: string;
  image: string;
}

export interface imageUpload {
  imageID: number;
  url: string;
  uploadDate: Date;
  count: number;
  userID: number;
}

export interface imageUser {
  count: number;
  imageID: number;
  url: string;
  voteScore: number;
  username: string;
  userID: number;
  rankToday: number;
  rankYesterday: number;
  rankDifferent: number;
  oldScore: number;
  image: string;
}
