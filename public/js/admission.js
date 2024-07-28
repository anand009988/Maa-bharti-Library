 document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('admissionForm');
            const nextButton = document.querySelector('.next-button');

            nextButton.addEventListener('click', () => {


		if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

               const shiftCheckboxes = document.querySelectorAll(
     'input[name="shifts"]:not(:disabled):checked'
   );
   const selectedShifts = [];

   shiftCheckboxes.forEach((checkbox) => {
     selectedShifts.push(Number(checkbox.value));
     console.log(`Checkbox value: ${checkbox.value}`); // Log each selected checkbox value
   });

   console.log(`Selected shifts: ${selectedShifts}`);

	if (shiftCheckboxes.length === 0) {
                    alert('Please select at least one shift.');
                    return;
                }

    if (!document.getElementById("submitCheckbox").checked) {
      alert("Please agree to the terms and conditions.");
      return;
    }

                // Prepare form data
                const formData = new FormData(form);
                formData.set('shifts', JSON.stringify(selectedShifts)); // Set 'shifts' as a JSON array in form data

                const selectedMonth = document.getElementById('month').value;
                formData.set('month', selectedMonth);

                // Convert formData to JSON and store it in sessionStorage
                const formObject = {};
                formData.forEach((value, key) => {
                    formObject[key] = value;
                });

                sessionStorage.setItem('admissionFormData', JSON.stringify(formObject));
                window.location.href = '/studentDashboard/payment?id=' + formObject.userId;
            });
        });
    
