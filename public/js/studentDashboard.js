document.addEventListener('DOMContentLoaded', () => {
  // Initially hide all content sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.add('hidden');
  });

  // Show the 'profile' section by default
  const profileSection = document.getElementById('profile');
  if (profileSection) {
    profileSection.classList.remove('hidden');
  } else {
    console.error('Profile section not found');
  }

  // Toggle navigation bar visibility
  const toggle = document.querySelector('.toggle');
  const navigation = document.querySelector('.navigation');
  const main = document.querySelector('.main');

  toggle.addEventListener('click', function() {
    navigation.classList.toggle('active');
    main.classList.toggle('active');
  });

  document.querySelectorAll('.navigation ul li').forEach(item => {
    item.addEventListener('click', event => {
      // Prevent the default link behavior
      event.preventDefault();

      // Get the content ID from the data-content attribute
      const contentId = item.getAttribute('data-content');
      console.log(contentId);
      if (!contentId) {
        console.error('No data-content attribute found');
        return;
      }

      // Hide all content sections
      document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
      });

      // Show the selected content section
      const selectedSection = document.getElementById(contentId);
      if (selectedSection) {
        selectedSection.classList.remove('hidden');
      } else {
        console.error(`Section with ID ${contentId} not found`);
      }

      // Trigger the toggle button click
      toggle.click();
    });
  });

  // Logout functionality
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', event => {
    event.preventDefault();
    console.log('Logout button clicked'); // Debugging log

    fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Logout fetch response:', response); // Debugging log
      if (response.ok) {
        // Redirect to login page or home page after successful logout
        window.location.href = '/loginSignup';
      } else {
        console.error('Logout failed');
      }
    })
    .catch(error => {
      console.error('Error during logout:', error);
    });
  });
});
