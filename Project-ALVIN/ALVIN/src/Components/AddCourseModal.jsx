import React, { useState, useRef, useEffect } from "react";
import { X, Check, ChevronDown, Upload } from "lucide-react";

// Preset solid color options
const COLOR_OPTIONS = [
  { id: "maroon", label: "Maroon", value: "bg-[#862334]" },
  { id: "navy", label: "Navy Blue", value: "bg-[#1E3A8A]" },
  { id: "emerald", label: "Emerald Green", value: "bg-[#065F46]" },
  { id: "purple", label: "Royal Purple", value: "bg-[#581C87]" },
  { id: "amber", label: "Amber Orange", value: "bg-[#C2410C]" },
  { id: "slate", label: "Dark Slate", value: "bg-[#1E293B]" },
];

const TERM_OPTIONS = ["First Semester", "Second Semester"];

export default function CreateCourseModal({ isOpen, onClose, onCreateCourse }) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [term, setTerm] = useState("First Semester");
  const [isTermOpen, setIsTermOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [imagePreview, setImagePreview] = useState("");

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTermOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        alert("Please upload a PNG or JPG/JPEG image file.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim() || !title.trim()) {
      return;
    }

    const newCourse = {
      code: code.trim(),
      title: title.trim(),
      section: section.trim(),
      term,
      color: selectedColor,
      imageUrl: imagePreview || null,
      image: imagePreview || null,
    };

    const result = await onCreateCourse(newCourse);

    if (result?.error) {
      return;
    }

    setCode("");
    setTitle("");
    setSection("");
    setTerm("First Semester");
    setSelectedColor(COLOR_OPTIONS[0].value);
    setImagePreview("");
    setIsTermOpen(false);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 font-Geist">Add New Course</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Cover Image <span className="text-gray-400 font-normal">(PNG or JPG)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleImageUpload}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative h-28 w-full rounded-xl overflow-hidden border border-gray-200 group">
                <img
                  src={imagePreview}
                  alt="Course Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-gray-200 hover:border-[#862334] rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-rose-50/20 transition-all cursor-pointer group"
              >
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#862334] transition-colors mb-1" />
                <span className="text-xs font-semibold text-gray-600 group-hover:text-[#862334]">
                  Upload Cover Image
                </span>
                <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
              </button>
            )}
          </div>

          {/* Course Code */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Course Code
            </label>
            <input
              type="text"
              placeholder="e.g. IPCR101"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#862334] transition-colors"
              required
            />
          </div>

          {/* Course Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Course Title
            </label>
            <input
              type="text"
              placeholder="e.g. Interview Preparation and Career Readiness"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#862334] transition-colors"
              required
            />
          </div>

          {/* Section & Term */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Section
              </label>
              <input
                type="text"
                placeholder="e.g. IT 4-2"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#862334] transition-colors"
              />
            </div>

            {/* Term Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Term
              </label>
              <button
                type="button"
                onClick={() => setIsTermOpen(!isTermOpen)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-[#862334] transition-colors cursor-pointer"
              >
                <span>{term}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTermOpen ? "rotate-180" : ""}`} />
              </button>

              {isTermOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden py-1">
                  {TERM_OPTIONS.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setTerm(option);
                        setIsTermOpen(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        term === option
                          ? "bg-[#862334] text-white font-medium"
                          : "text-gray-700 hover:bg-[#862334]/10 hover:text-[#862334]"
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Course Color Options */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Course Card Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedColor(opt.value)}
                  title={opt.label}
                  className={`h-9 rounded-xl ${opt.value} flex items-center justify-center cursor-pointer ${
                    selectedColor === opt.value
                      ? "ring-2 ring-offset-2 ring-[#862334]"
                      : ""
                  }`}
                >
                  {selectedColor === opt.value && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#862334] hover:bg-[#701c2b] rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Add Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}