"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navSubmit.show();
  $navFavorites.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

// When the user clicks 'submit' in the nav bar, show submission form
function navSubmitClick(evt) {
  console.debug("navSubmitClick", evt);
  hidePageComponents();
  $storySubmitForm.show();
}

$navSubmit.on("click", navSubmitClick);

//when logged in user clicks favorites in the nav bar, show only favorites
function navFavoriteStories(evt) {
  console.debug("navFavoriteStories", evt);
  hidePageComponents();
  putFavoritesOnPage();
}

$navFavorites.on("click", navFavoriteStories);
