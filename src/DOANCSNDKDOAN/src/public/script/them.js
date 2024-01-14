 // Initialize data from Local Storage or an empty array
 var tableData = JSON.parse(localStorage.getItem('tableData')) || [];

 // Define the 'session' variable with appropriate values
 var session = {
     userType: 'student', // Replace with the actual user type
     editPermission: true, // Replace with the actual edit permission
 };

 // Connect to the WebSocket server
 const socket = io('http://localhost:7979'); 

 // Listen for 'dataChange' event from the server
 socket.on('dataChange', function () {
     // Handle data change, for example, call the fetchData function
     fetchData();
 });

 // Listen for 'logout' event from the server
 socket.on('logout', function () {
     // Handle logout, for example, redirect to the login page
     window.location.href = '/login';
 });

 function addRow() {
     var table = document.getElementById("myTable");
     var row = table.insertRow(-1);

     for (var i = 0; i < 4; i++) {
         var cell = row.insertCell(i);
         var input = document.createElement("div");
         input.className = "edit-input";
         input.id = "row" + (table.rows.length - 1) + "_col" + i; // Unique ID for each input
         cell.appendChild(input);
     }

     var actionsCell = row.insertCell(4);

     var editButton = document.createElement("button");
     editButton.textContent = "Sửa";
     editButton.onclick = function () {
         editRow(row);
     };
     actionsCell.appendChild(editButton);

     var saveButton = document.createElement("button");
     saveButton.textContent = "Lưu";
     saveButton.onclick = function () {
         saveRow(row);
     };
     saveButton.style.display = "none"; // Hide the "Save" button until "Edit" is clicked
     actionsCell.appendChild(saveButton);

     var deleteButton = document.createElement("button");
     deleteButton.textContent = "Xóa";
     deleteButton.onclick = function () {
         deleteRow(row);
     };
     actionsCell.appendChild(deleteButton);

     row.onclick = function (event) {
         var clickedCell = event.target;

         if (session.userType === "student") {
             // Only allow editing for student rows and when the user type is "student"
             if (clickedCell.cellIndex === 3) {
                 // Allow editing only for the "Thông tin sinh viên" column
                 row.classList.add("selected");
                 document.getElementById("userInfo").innerText = "Thông tin người dùng: " +
                     document.getElementById("row" + (table.rows.length - 1) + "_col0").innerHTML + " " +
                     document.getElementById("row" + (table.rows.length - 1) + "_col1").innerHTML + " " +
                     document.getElementById("row" + (table.rows.length - 1) + "_col2").innerHTML + " " +
                     document.getElementById("row" + (table.rows.length - 1) + "_col3").innerHTML;

                 saveButton.style.display = "inline-block";
             } else {
                 row.classList.remove("selected");
                 saveButton.style.display = "none";
             }
         }
     };

     updateAccessControl();
 }

 function editRow(row) {
     var inputs = row.querySelectorAll(".edit-input");
     inputs.forEach(function (input) {
         input.contentEditable = true;
     });
 }

 function deleteRow(row) {
var table = document.getElementById("myTable");

if (row.classList.contains("new-row")) {
 // If it's a new row, simply remove it from the table
 table.deleteRow(row.rowIndex);
 updateLocalStorage();
} else {
 // If it's an existing row, prompt the user for confirmation
 var confirmation = confirm("Bạn có chắc chắn muốn xóa dòng này không?");

 if (confirmation) {
     // If the user confirms, remove the row from the table
     table.deleteRow(row.rowIndex);
     updateLocalStorage();
 }
}
}

 function saveRow(row) {
     var inputs = row.querySelectorAll(".edit-input");
     var rowData = {};
     inputs.forEach(function (input) {
         var idParts = input.id.split("_");
         var columnName = "column" + idParts[1].replace("col", ""); // Extracting column number from ID
         rowData[columnName] = input.innerHTML;
         input.contentEditable = false;
     });

     // Add or update the row data in the array
     if (row.classList.contains("new-row")) {
         tableData.push(rowData);
     } else {
         var rowIndex = row.rowIndex - 1; // Adjusting for header row
         tableData[rowIndex] = rowData;
     }

     updateLocalStorage();
     row.classList.remove("selected");
     updateUserInfo();
 }

 function updateUserInfo() {
     var userInfoDiv = document.getElementById("userInfo");
     var selectedRow = document.querySelector(".selected");

     if (selectedRow) {
         var userInfo = "Thông tin người dùng: ";
         var cells = selectedRow.cells;
         for (var i = 0; i < cells.length - 1; i++) {
             var input = document.getElementById("row" + (selectedRow.rowIndex - 1) + "_col" + i);
             userInfo += input.innerHTML + " ";
         }
         userInfoDiv.innerText = userInfo;
     }
 }

 function updateAccessControl() {
     var userType = session.userType || "guest"; // Assume a default userType if not provided

     var allInputs = document.querySelectorAll(".edit-input");
     allInputs.forEach(function (input) {
         input.contentEditable = false;
     });

     if (userType === "student") {
         var studentInfoInputs = document.querySelectorAll(".student-row .edit-input:nth-child(4)");
         studentInfoInputs.forEach(function (input) {
             input.contentEditable = true;
         });
     }
 }

 function updateLocalStorage() {
     localStorage.setItem('tableData', JSON.stringify(tableData));
 }

 function initializeTable() {
     var table = document.getElementById("myTable");

     if (!table) {
         console.error("Table element not found");
         return;
     }

     table.innerHTML = "<tr><th>Giáo viên hướng dẫn</th><th>Đề tài</th><th>Lưu ý</th><th>Thông tin sinh viên</th><th>Hành động</th></tr>";

     tableData.forEach(function (rowData, index) {
         var row = table.insertRow(-1);
         row.classList.add("student-row");
         for (var i = 0; i < 4; i++) {
             var cell = row.insertCell(i);
             var input = document.createElement("div");
             input.className = "edit-input";
             input.id = "row" + index + "_col" + i;
             input.innerHTML = rowData["column" + i];
             cell.appendChild(input);

             if (i === 3 && session.userType === "student") {
                 input.contentEditable = true;
             } else {
                 input.contentEditable = false;
             }
         }

         var actionsCell = row.insertCell(4);

         var editButton = document.createElement("button");
         editButton.textContent = "Sửa";
         editButton.onclick = function () {
             editRow(row);
         };
         actionsCell.appendChild(editButton);

         var saveButton = document.createElement("button");
         saveButton.textContent = "Lưu";
         saveButton.onclick = function () {
             saveRow(row);
         };
         saveButton.style.display = "none";
         actionsCell.appendChild(saveButton);

         var deleteButton = document.createElement("button");
         deleteButton.textContent = "Xóa";
         deleteButton.onclick = function () {
             deleteRow(row);
         };
         actionsCell.appendChild(deleteButton);

         row.onclick = function (event) {
             var clickedCell = event.target;

             if (session.userType === "student") {
                 // Only allow editing for student rows and when the user type is "student"
                 if (clickedCell.cellIndex === 3) {
                     // Allow editing only for the "Thông tin sinh viên" column
                     row.classList.add("selected");
                     document.getElementById("userInfo").innerText = "Thông tin người dùng: " +
                         document.getElementById("row" + index + "_col0").innerHTML + " " +
                         document.getElementById("row" + index + "_col1").innerHTML + " " +
                         document.getElementById("row" + index + "_col2").innerHTML + " " +
                         document.getElementById("row" + index + "_col3").innerHTML;

                     saveButton.style.display = "inline-block";
                 } else {
                     row.classList.remove("selected");
                     saveButton.style.display = "none";
                 }
             }
         };
     });

     updateAccessControl();

     // Show the "Thêm" button only if the user has edit permission
     var addButton = document.querySelector("button[onclick='addRow()']");
     if (addButton) {
         addButton.style.display = session.editPermission ? "inline-block" : "none";
     } else {
         console.error("Add button element not found");
     }
 }

 // Call the initializeTable function
 initializeTable();