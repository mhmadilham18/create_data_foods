document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL =
    "https://backend-javascript-sahabat-gula-166777420148.asia-southeast1.run.app";
  const ACCESS_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIyMDU0MmM5LTQzODYtNDYzNi1iOTA2LTg2M2YzNmNiYzdkZCIsImVtYWlsIjoiZml0cmlAc2FoYWJhdGd1bGEuY29tIiwicm9sZSI6ImFkbWluIiwidXNlcm5hbWUiOiJmaXRyaSIsImlhdCI6MTc1OTIyNTI1MCwiZXhwIjoxNzU5ODMwMDUwfQ.BPGnhaHUpBljb2TACGJWViGZSkiu1cDn7-HfyCw_bRY";

  const foodForm = document.getElementById("foodForm");
  const categorySelect = document.getElementById("category_id");
  const photoInput = document.getElementById("photo_file");
  const imagePreviewWrapper = document.getElementById("imagePreviewWrapper");
  const imagePreview = document.getElementById("imagePreview");
  const removeImageBtn = document.getElementById("removeImageBtn");
  const fileDropArea = document.getElementById("fileDropArea");
  const fileDropText = document.getElementById("fileDropText");
  const submitBtn = document.getElementById("submitBtn");
  const spinner = submitBtn.querySelector(".spinner");
  const btnText = submitBtn.querySelector(".btn-text");

  // --- FUNGSI UTAMA ---

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/food-categories`);
      if (!response.ok) throw new Error("Gagal memuat kategori");
      const result = await response.json();
      const categories = result.data || [];

      categorySelect.innerHTML = '<option value="">Pilih Kategori...</option>';
      categories.forEach((cat) =>
        categorySelect.add(new Option(cat.name, cat.id))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      showNotification(
        "warning",
        "Gagal Memuat Kategori",
        "Anda masih bisa membuat kategori baru."
      );
    }
  };

  const handleImagePreview = (file) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewWrapper.style.display = "block";
        fileDropText.textContent = `File terpilih: ${file.name}`;
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImageSelection = () => {
    photoInput.value = "";
    imagePreviewWrapper.style.display = "none";
    imagePreview.src = "#";
    fileDropText.textContent = "Klik atau drag & drop foto di sini";
  };

  const setLoadingState = (isLoading) => {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("loading", isLoading);
    btnText.textContent = isLoading ? "Menyimpan..." : "Simpan Data Makanan";
  };

  const showNotification = (icon, title, text) => {
    Swal.fire({
      icon,
      title,
      text,
      confirmButtonColor: "var(--primary-color)",
    });
  };

  const resetForm = () => {
    foodForm.reset();
    resetImageSelection();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validasi dasar
    const requiredFields = ["name", "serving_size", "weight_size"];
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        showNotification(
          "warning",
          "Field Wajib",
          `Field "${field.labels[0].textContent.replace(
            " *",
            ""
          )}" harus diisi.`
        );
        field.focus();
        return;
      }
    }
    if (photoInput.files[0] && photoInput.files[0].size > 5 * 1024 * 1024) {
      showNotification(
        "warning",
        "Ukuran File",
        "Ukuran foto tidak boleh melebihi 5MB."
      );
      return;
    }

    setLoadingState(true);

    // MEMBUAT FORMDATA SECARA MANUAL UNTUK KONTROL PENUH
    const formData = new FormData();

    // 1. Tambahkan field yang pasti ada atau wajib
    formData.append("name", document.getElementById("name").value);
    formData.append(
      "serving_size",
      document.getElementById("serving_size").value
    );
    formData.append(
      "weight_size",
      document.getElementById("weight_size").value
    );

    // 2. Tambahkan field opsional (string) hanya jika diisi
    const description = document.getElementById("description").value;
    if (description) formData.append("description", description);

    const serving_unit = document.getElementById("serving_unit").value;
    if (serving_unit) formData.append("serving_unit", serving_unit);

    const weight_unit = document.getElementById("weight_unit").value;
    if (weight_unit) formData.append("weight_unit", weight_unit);

    // 3. Logika kategori
    const categoryId = document.getElementById("category_id").value;
    const categoryName = document.getElementById("category_name").value;
    if (categoryName) {
      formData.append("category_name", categoryName);
    } else if (categoryId) {
      formData.append("category_id", categoryId);
    }

    // 4. Tambahkan file gambar jika ada
    if (photoInput.files.length > 0) {
      formData.append("photo_file", photoInput.files[0]);
    }

    // 5. Tambahkan field nutrisi (angka) HANYA JIKA DIISI + Lakukan konversi
    const nutritionFields = [
      "calories",
      "carbs",
      "protein",
      "fat",
      "sugar",
      "sodium",
      "fiber",
      "potassium",
    ];
    nutritionFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      const value = field.value.trim();

      // Hanya proses jika ada nilai
      if (value !== "") {
        let numericValue = parseFloat(value);

        // Konversi sodium dan potassium dari mg ke g
        if (fieldId === "sodium" || fieldId === "potassium") {
          numericValue = numericValue / 1000;
        }

        formData.append(fieldId, numericValue);
      }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/foods`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Terjadi kesalahan pada server");

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data makanan berhasil disimpan.",
        timer: 2000,
        showConfirmButton: false,
      });
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Submit error:", error);
      showNotification("error", "Gagal Menyimpan", error.message);
    } finally {
      setLoadingState(false);
    }
  };

  // --- EVENT LISTENERS ---

  photoInput.addEventListener("change", () =>
    handleImagePreview(photoInput.files[0])
  );
  removeImageBtn.addEventListener("click", resetImageSelection);

  ["dragover", "dragleave", "drop"].forEach((eventName) =>
    fileDropArea.addEventListener(eventName, (e) => e.preventDefault())
  );
  fileDropArea.addEventListener("dragover", () =>
    fileDropArea.classList.add("dragover")
  );
  fileDropArea.addEventListener("dragleave", () =>
    fileDropArea.classList.remove("dragover")
  );
  fileDropArea.addEventListener("drop", (e) => {
    fileDropArea.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      photoInput.files = e.dataTransfer.files;
      handleImagePreview(photoInput.files[0]);
    }
  });
  fileDropArea.addEventListener("click", () => photoInput.click());

  foodForm.addEventListener("submit", handleFormSubmit);

  // --- INISIALISASI ---
  fetchCategories();
});
