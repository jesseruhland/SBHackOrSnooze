"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // UNIMPLEMENTED: complete this function!
    let urlObj = new URL(this.url);
    return urlObj.host;
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map((story) => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  //****************Written by JR */
  //allows user to post a new story to the API or edit an existing story if ID is passed
  //methodText must be "POST" to post a new story or "PATCH" to edit
  //storyId must be an empty string to post a new story
  async addOrEditStory(username, newStory, methodText, storyId) {
    try {
      const result = await axios({
        url: `${BASE_URL}/stories/${storyId}`,
        method: methodText,
        data: {
          token: username.loginToken,
          story: {
            author: newStory.author,
            title: newStory.title,
            url: newStory.url,
          },
        },
      });

      return new Story(result.data.story);
    } catch (e) {
      alert("There's a been an error contacting the database.");
    }
  }

  //****************Written by JR */
  //Remove story data from API
  async removeStory(user, storyId) {
    try {
      const result = await axios({
        url: `${BASE_URL}/stories/${storyId}`,
        method: "DELETE",
        data: {
          token: user.loginToken,
        },
      });
    } catch (e) {
      alert("There's a been an error contacting the database.");
    }
  }

  //****************Written by JR */
  //Retrieve story data by story ID
  async getStoryById(storyId) {
    const response = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "GET",
    });
    return response.data.story;
  }
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor(
    { username, name, createdAt, favorites = [], ownStories = [] },
    token
  ) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  //Added some error handling in the case of a username conflict  //****************Written by JR */
  static async signup(username, password, name) {
    try {
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });

      let { user } = response.data;
      console.log(response);
      console.log(response.data);

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        response.data.token
      );
    } catch (error) {
      //****************Written by JR */
      if (error.response.status === 409) {
        alert("Please choose a different username, this one is already taken.");
      }
    }
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }
  //
  //
  //
  //
  //OWN STORIES  //****************Written by JR */

  //retrieve user stories from API
  //storyType must be "stories" for user submissions, or "favorites" for saved favorites
  async getUserSavedStories(username, storyType) {
    const token = username.loginToken;
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username.username}`,
        method: "GET",
        params: { token },
      });
      return response.data.user[storyType];
    } catch (e) {
      alert("There's a been an error contacting the database.");
    }
  }

  // //retrieve user's ownStories (submissions) from API (reconfigured above)
  // async getOwnStories(username) {
  //   const token = username.loginToken;
  //   try {
  //     const response = await axios({
  //       url: `${BASE_URL}/users/${username.username}`,
  //       method: "GET",
  //       params: { token },
  //     });

  //     return response.data.user.stories;
  //   } catch (e) {
  //     alert("There's a been an error contacting the database.");
  //   }
  // }

  //FAVORITES  //****************Written by JR */ (reconfigured above)

  // //retrieve user's favorites from API (reconfigured above)
  // async getUserFavorites(username) {
  //   const token = username.loginToken;
  //   try {
  //     const response = await axios({
  //       url: `${BASE_URL}/users/${username.username}`,
  //       method: "GET",
  //       params: { token },
  //     });

  //     return response.data.user.favorites;
  //   } catch (e) {
  //     alert("There's a been an error contacting the database.");
  //   }
  // }
  //
  //
  //
  //
  //FAVORITES  //****************Written by JR */

  //post or delete a user favorite story
  //methodText must be "POST" or "DELETE"
  async postOrDeleteFavorite(username, favoriteStoryId, methodText) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username.username}/favorites/${favoriteStoryId}`,
        method: methodText,
        data: { token: username.loginToken },
      });
    } catch (e) {
      alert("There's a been an error contacting the database.");
    }
  }

  // //post new user favorite to API (reconfigured above)
  // async newFavorite(username, favoriteStoryId) {
  //   try {
  //     const response = await axios({
  //       url: `${BASE_URL}/users/${username.username}/favorites/${favoriteStoryId}`,
  //       method: "POST",
  //       data: { token: username.loginToken },
  //     });
  //   } catch (e) {
  //     alert("There's a been an error contacting the database.");
  //   }
  // }

  // //remove new user favorite from API (reconfigured above)
  // async removeFavorite(username, favoriteStoryId) {
  //   try {
  //     const response = await axios({
  //       url: `${BASE_URL}/users/${username.username}/favorites/${favoriteStoryId}`,
  //       method: "DELETE",
  //       data: { token: username.loginToken },
  //     });
  //   } catch (e) {
  //     alert("There's a been an error contacting the database.");
  //   }
  // }
}
