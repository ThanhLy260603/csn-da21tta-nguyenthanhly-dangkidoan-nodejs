$(document).ready(function () {
    // Use a function to fetch and display data
    function fetchData() {
        $.ajax({
            url: '/api/studentData',
            type: 'GET',
            success: function (data) {
                console.log('Data from server:', data);

                // Clear existing table rows
                $('#myTable tbody').empty();

                // Populate the table with fetched data
                data.studentData.forEach(function (row) {
                    // Determine if the user is a student
                    var isStudent = data.userType === 'student';

                    // Append rows to the table
                    $('#myTable tbody').append(`
                        <tr>
                            <td>${row.teacherName}</td>
                            <td>${row.topic}</td>
                            <td>${row.note}</td>
                            <td class="${isStudent ? 'editable-cell' : ''}">${row.studentInfo}</td>
                            <td>
                                ${isStudent ? '' : '<button class="deleteButton">Delete</button>'}
                                <!-- Add any other actions/buttons here -->
                            </td>
                        </tr>
                    `);
                });

                // Enable or disable editing based on user type
                $('.editable-cell').prop('contenteditable', isStudent);

                // Add an event listener to the delete button
                $('.deleteButton').on('click', function () {
                    if (!isStudent) {
                        // Handle delete logic for non-student users
                        // For example: $(this).closest('tr').remove();
                        console.log('Delete action performed');
                    }
                });
            },
            error: function (error) {
                console.error('Error fetching student data:', error);
            }
        });
    }

    // Call the fetch function initially
    fetchData();

    // Add an event listener to the refresh button
    $('#refreshButton').on('click', function () {
        // Call the fetch function when the button is clicked
        fetchData();
    });

    // Function to periodically fetch data (every 5 seconds in this example)
    setInterval(fetchData, 5000);
});