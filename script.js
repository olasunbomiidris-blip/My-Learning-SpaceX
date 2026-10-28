// Select the registration form
const registrationForm = document.getElementById("registrationForm");

// Listen for form submission
if (registrationForm) {
    registrationForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        // Get the student's details
        const name = document.getElementById("studentName").value.trim();
        const email = document.getElementById("studentEmail").value.trim();
        const course = document.getElementById("course").value;
        const about = document.getElementById("studentAbout").value.trim();

        // Check required fields
        if (name === "" || email === "" || course === "") {
            alert("Please fill in all required fields!");
            return;
        }

        try {
            // Send the registration to the server
            const response = await fetch("/api/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, course, about })
            });

            if (!response.ok) {
                const result = await response.json();
                alert(result.error || "Something went wrong. Please try again.");
                return;
            }

            // Show confirmation
            alert(
                "Registration saved successfully! 🎉\n\n" +
                "Welcome, " + name + "!\n" +
                "Course: " + course
            );

            // Clear the form and refresh the student list
            registrationForm.reset();
            displayingRegisteredStudents();
        } catch (error) {
            alert("Could not reach the server. Is it running?");
        }
    });
}

// Display registered students on the main website
async function displayingRegisteredStudents() {
    const studentList = document.getElementById("studentList");
    const noStudentsMessage = document.getElementById("noStudentsMessage");

    // Stop if this section does not exist on the current page
    if (!studentList || !noStudentsMessage) {
        return;
    }

    // Get the students from the server
    let students = [];

    try {
        const response = await fetch("/api/students");
        students = await response.json();

        if (!Array.isArray(students)) {
            students = [];
        }
    } catch (error) {
        students = [];
    }

    // Clear the old display
    studentList.replaceChildren();

    // Show a message if there are no registrations
    noStudentsMessage.style.display =
        students.length === 0 ? "block" : "none";

    // Create a card for each student
    students.forEach(function(student) {
        const card = document.createElement("div");
        card.className = "student-card";

        const studentName = document.createElement("h3");
        studentName.textContent = student.name || "Student";

        const studentCourse = document.createElement("p");
        studentCourse.textContent =
            "Course: " + (student.course || "Not specified");

        card.appendChild(studentName);
        card.appendChild(studentCourse);

        studentList.appendChild(card);
    });
}

// Display students when the page loads
displayingRegisteredStudents();