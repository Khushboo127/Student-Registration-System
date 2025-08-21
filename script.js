/**
 * Student Registration System
 * A comprehensive system for managing student records with CRUD operations
 * Features: Add, Edit, Delete, Search, Local Storage, Input Validation
 */

class StudentRegistrationSystem {
  constructor() {
    this.students = this.loadFromStorage()
    this.editingIndex = -1
    this.init()
  }

  /**
   * Initialize the application
   */
  init() {
    this.bindEvents()
    this.renderRecords()
    this.updateStats()
    this.setupNavigation()
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Form submission
    document.getElementById("studentForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleFormSubmit()
    })

    // Edit form submission
    document.getElementById("editForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleEditSubmit()
    })

    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const target = link.getAttribute("href").substring(1)
        this.showSection(target)
      })
    })

    // Modal controls
    document.getElementById("closeModal").addEventListener("click", () => {
      this.closeModal()
    })

    document.getElementById("cancelEdit").addEventListener("click", () => {
      this.closeModal()
    })

    // Cancel button
    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.resetForm()
    })

    // Search functionality
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.searchRecords(e.target.value)
    })

    // Real-time validation
    this.setupRealTimeValidation()

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      const modal = document.getElementById("editModal")
      if (e.target === modal) {
        this.closeModal()
      }
    })
  }

  /**
   * Setup real-time input validation
   */
  setupRealTimeValidation() {
    const inputs = [
      { id: "studentName", validator: this.validateName, errorId: "nameError" },
      { id: "studentId", validator: this.validateStudentId, errorId: "idError" },
      { id: "email", validator: this.validateEmail, errorId: "emailError" },
      { id: "contactNo", validator: this.validateContact, errorId: "contactError" },
    ]

    inputs.forEach(({ id, validator, errorId }) => {
      const input = document.getElementById(id)
      const errorElement = document.getElementById(errorId)

      input.addEventListener("blur", () => {
        const result = validator.call(this, input.value, id === "studentId" ? -1 : this.editingIndex)
        this.displayError(errorElement, input, result)
      })

      input.addEventListener("input", () => {
        if (input.classList.contains("error")) {
          const result = validator.call(this, input.value, id === "studentId" ? -1 : this.editingIndex)
          if (result.isValid) {
            this.clearError(errorElement, input)
          }
        }
      })
    })

    // Edit form validation
    const editInputs = [
      { id: "editName", validator: this.validateName, errorId: "editNameError" },
      { id: "editId", validator: this.validateStudentId, errorId: "editIdError" },
      { id: "editEmail", validator: this.validateEmail, errorId: "editEmailError" },
      { id: "editContact", validator: this.validateContact, errorId: "editContactError" },
    ]

    editInputs.forEach(({ id, validator, errorId }) => {
      const input = document.getElementById(id)
      const errorElement = document.getElementById(errorId)

      input.addEventListener("blur", () => {
        const excludeIndex = id === "editId" ? Number.parseInt(document.getElementById("editIndex").value) : -1
        const result = validator.call(this, input.value, excludeIndex)
        this.displayError(errorElement, input, result)
      })

      input.addEventListener("input", () => {
        if (input.classList.contains("error")) {
          const excludeIndex = id === "editId" ? Number.parseInt(document.getElementById("editIndex").value) : -1
          const result = validator.call(this, input.value, excludeIndex)
          if (result.isValid) {
            this.clearError(errorElement, input)
          }
        }
      })
    })
  }

  /**
   * Setup navigation functionality
   */
  setupNavigation() {
    // Show registration section by default
    this.showSection("registration")
  }

  /**
   * Show specific section and update navigation
   */
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active")
    })

    // Show target section
    document.getElementById(sectionId).classList.add("active")

    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })

    document.querySelector(`[href="#${sectionId}"]`).classList.add("active")

    // If showing records, refresh the display
    if (sectionId === "records") {
      this.renderRecords()
      this.updateStats()
    }
  }

  /**
   * Handle main form submission
   */
  handleFormSubmit() {
    const formData = this.getFormData()

    if (this.validateForm(formData)) {
      this.addStudent(formData)
      this.resetForm()
      this.showSuccessMessage("Student registered successfully!")

      // Auto-switch to records view
      setTimeout(() => {
        this.showSection("records")
      }, 1000)
    }
  }

  /**
   * Handle edit form submission
   */
  handleEditSubmit() {
    const formData = this.getEditFormData()
    const index = Number.parseInt(document.getElementById("editIndex").value)

    if (this.validateEditForm(formData, index)) {
      this.updateStudent(index, formData)
      this.closeModal()
      this.showSuccessMessage("Student record updated successfully!")
    }
  }

  /**
   * Get form data from main form
   */
  getFormData() {
    return {
      name: document.getElementById("studentName").value.trim(),
      studentId: document.getElementById("studentId").value.trim(),
      email: document.getElementById("email").value.trim(),
      contact: document.getElementById("contactNo").value.trim(),
    }
  }

  /**
   * Get form data from edit form
   */
  getEditFormData() {
    return {
      name: document.getElementById("editName").value.trim(),
      studentId: document.getElementById("editId").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
      contact: document.getElementById("editContact").value.trim(),
    }
  }

  /**
   * Validate main form
   */
  validateForm(data) {
    let isValid = true
    const validations = [
      { field: "name", validator: this.validateName, errorId: "nameError", inputId: "studentName" },
      { field: "studentId", validator: this.validateStudentId, errorId: "idError", inputId: "studentId" },
      { field: "email", validator: this.validateEmail, errorId: "emailError", inputId: "email" },
      { field: "contact", validator: this.validateContact, errorId: "contactError", inputId: "contactNo" },
    ]

    validations.forEach(({ field, validator, errorId, inputId }) => {
      const result = validator.call(this, data[field], field === "studentId" ? -1 : this.editingIndex)
      const errorElement = document.getElementById(errorId)
      const inputElement = document.getElementById(inputId)

      this.displayError(errorElement, inputElement, result)

      if (!result.isValid) {
        isValid = false
      }
    })

    return isValid
  }

  /**
   * Validate edit form
   */
  validateEditForm(data, excludeIndex) {
    let isValid = true
    const validations = [
      { field: "name", validator: this.validateName, errorId: "editNameError", inputId: "editName" },
      { field: "studentId", validator: this.validateStudentId, errorId: "editIdError", inputId: "editId" },
      { field: "email", validator: this.validateEmail, errorId: "editEmailError", inputId: "editEmail" },
      { field: "contact", validator: this.validateContact, errorId: "editContactError", inputId: "editContact" },
    ]

    validations.forEach(({ field, validator, errorId, inputId }) => {
      const result = validator.call(this, data[field], field === "studentId" ? excludeIndex : -1)
      const errorElement = document.getElementById(errorId)
      const inputElement = document.getElementById(inputId)

      this.displayError(errorElement, inputElement, result)

      if (!result.isValid) {
        isValid = false
      }
    })

    return isValid
  }

  /**
   * Validation functions
   */
  validateName(name) {
    if (!name) {
      return { isValid: false, message: "Name is required" }
    }
    if (name.length < 2) {
      return { isValid: false, message: "Name must be at least 2 characters long" }
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return { isValid: false, message: "Name can only contain letters and spaces" }
    }
    return { isValid: true, message: "" }
  }

  validateStudentId(studentId, excludeIndex = -1) {
    if (!studentId) {
      return { isValid: false, message: "Student ID is required" }
    }
    if (!/^\d+$/.test(studentId)) {
      return { isValid: false, message: "Student ID can only contain numbers" }
    }
    if (studentId.length < 3) {
      return { isValid: false, message: "Student ID must be at least 3 digits long" }
    }

    // Check for duplicate student ID
    const existingIndex = this.students.findIndex((student) => student.studentId === studentId)
    if (existingIndex !== -1 && existingIndex !== excludeIndex) {
      return { isValid: false, message: "Student ID already exists" }
    }

    return { isValid: true, message: "" }
  }

  validateEmail(email) {
    if (!email) {
      return { isValid: false, message: "Email is required" }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Please enter a valid email address" }
    }
    return { isValid: true, message: "" }
  }

  validateContact(contact) {
    if (!contact) {
      return { isValid: false, message: "Contact number is required" }
    }
    if (!/^\d+$/.test(contact)) {
      return { isValid: false, message: "Contact number can only contain numbers" }
    }
    if (contact.length < 10) {
      return { isValid: false, message: "Contact number must be at least 10 digits long" }
    }
    return { isValid: true, message: "" }
  }

  /**
   * Display validation error
   */
  displayError(errorElement, inputElement, result) {
    if (!result.isValid) {
      errorElement.textContent = result.message
      inputElement.classList.add("error")
    } else {
      this.clearError(errorElement, inputElement)
    }
  }

  /**
   * Clear validation error
   */
  clearError(errorElement, inputElement) {
    errorElement.textContent = ""
    inputElement.classList.remove("error")
  }

  /**
   * Add new student
   */
  addStudent(studentData) {
    const student = {
      ...studentData,
      id: Date.now(), // Simple ID generation
      createdAt: new Date().toISOString(),
    }

    this.students.push(student)
    this.saveToStorage()
    this.renderRecords()
    this.updateStats()
  }

  /**
   * Update existing student
   */
  updateStudent(index, studentData) {
    if (index >= 0 && index < this.students.length) {
      this.students[index] = {
        ...this.students[index],
        ...studentData,
        updatedAt: new Date().toISOString(),
      }
      this.saveToStorage()
      this.renderRecords()
      this.updateStats()
    }
  }

  /**
   * Delete student
   */
  deleteStudent(index) {
    if (index >= 0 && index < this.students.length) {
      const student = this.students[index]

      if (confirm(`Are you sure you want to delete the record for ${student.name}?`)) {
        this.students.splice(index, 1)
        this.saveToStorage()
        this.renderRecords()
        this.updateStats()
        this.showSuccessMessage("Student record deleted successfully!")
      }
    }
  }

  /**
   * Edit student - open modal
   */
  editStudent(index) {
    if (index >= 0 && index < this.students.length) {
      const student = this.students[index]

      // Populate edit form
      document.getElementById("editIndex").value = index
      document.getElementById("editName").value = student.name
      document.getElementById("editId").value = student.studentId
      document.getElementById("editEmail").value = student.email
      document.getElementById("editContact").value = student.contact

      // Clear any previous errors
      document.querySelectorAll("#editModal .error-message").forEach((error) => {
        error.textContent = ""
      })
      document.querySelectorAll("#editModal .form-input").forEach((input) => {
        input.classList.remove("error")
      })

      // Show modal
      document.getElementById("editModal").style.display = "block"
    }
  }

  /**
   * Close edit modal
   */
  closeModal() {
    document.getElementById("editModal").style.display = "none"
  }

  /**
   * Reset main form
   */
  resetForm() {
    document.getElementById("studentForm").reset()

    // Clear all error messages and styles
    document.querySelectorAll(".error-message").forEach((error) => {
      error.textContent = ""
    })
    document.querySelectorAll(".form-input").forEach((input) => {
      input.classList.remove("error")
    })
  }

  /**
   * Render all student records
   */
  renderRecords(studentsToRender = null) {
    const students = studentsToRender || this.students
    const tbody = document.getElementById("recordsBody")
    const noRecords = document.getElementById("noRecords")
    const table = document.getElementById("recordsTable")

    if (students.length === 0) {
      table.style.display = "none"
      noRecords.style.display = "block"
      return
    }

    table.style.display = "table"
    noRecords.style.display = "none"

    tbody.innerHTML = students
      .map((student, index) => {
        const originalIndex = studentsToRender ? this.students.indexOf(student) : index
        return `
                <tr>
                    <td>${this.escapeHtml(student.name)}</td>
                    <td>${this.escapeHtml(student.studentId)}</td>
                    <td>${this.escapeHtml(student.email)}</td>
                    <td>${this.escapeHtml(student.contact)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit" onclick="studentSystem.editStudent(${originalIndex})">
                                Edit
                            </button>
                            <button class="btn btn-delete" onclick="studentSystem.deleteStudent(${originalIndex})">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")

    // Add dynamic scrollbar if needed
    this.updateScrollbar()
  }

  /**
   * Update scrollbar visibility
   */
  updateScrollbar() {
    const tableContainer = document.getElementById("tableContainer")
    const table = document.getElementById("recordsTable")

    if (table.scrollHeight > tableContainer.clientHeight) {
      tableContainer.style.overflowY = "auto"
    } else {
      tableContainer.style.overflowY = "hidden"
    }
  }

  /**
   * Search records
   */
  searchRecords(query) {
    if (!query.trim()) {
      this.renderRecords()
      return
    }

    const filteredStudents = this.students.filter(
      (student) =>
        student.name.toLowerCase().includes(query.toLowerCase()) ||
        student.studentId.toLowerCase().includes(query.toLowerCase()) ||
        student.email.toLowerCase().includes(query.toLowerCase()) ||
        student.contact.includes(query),
    )

    this.renderRecords(filteredStudents)
  }

  /**
   * Update statistics
   */
  updateStats() {
    document.getElementById("totalCount").textContent = this.students.length
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    // Create and show a temporary success message
    const successDiv = document.createElement("div")
    successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `
    successDiv.textContent = message

    document.body.appendChild(successDiv)

    setTimeout(() => {
      successDiv.style.animation = "slideOutRight 0.3s ease"
      setTimeout(() => {
        document.body.removeChild(successDiv)
      }, 300)
    }, 3000)
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Local Storage Operations
   */
  saveToStorage() {
    try {
      localStorage.setItem("studentRecords", JSON.stringify(this.students))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem("studentRecords")
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading from localStorage:", error)
      return []
    }
  }
}

// Add CSS animations for success messages
const style = document.createElement("style")
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`
document.head.appendChild(style)

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.studentSystem = new StudentRegistrationSystem()
})
