import React, { useState, useRef, useEffect } from "react";
import { X, Check, ChevronDown, Upload } from "lucide-react";

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

  // Close custom dropdown when clicking outside
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

    if (!code.trim() || !title.trim() || !section.trim()) {
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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-Inter">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-900 font-Geist">
              Add New Course
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill in the details to create a new course
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Cover Image Upload (Top) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
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
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Course Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. IPCR101"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] transition-all"
            />
          </div>

          {/* Course Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Course Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Interview Preparation and Career Readiness"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] transition-all"
            />
          </div>

          {/* Section & Term / AY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Section <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. IT 4-2"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] transition-all"
              />
            </div>

            {/* Custom Term / AY Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Term / AY <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setIsTermOpen((prev) => !prev)}
                className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                  isTermOpen
                    ? "bg-white border-[#862334] ring-2 ring-[#862334]/10"
                    : "border-gray-200 hover:bg-gray-100"
                }`}
              >
                <span className="truncate text-gray-800 text-xs font-medium">
                  {term || "Select Term"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${
                    isTermOpen ? "rotate-180 text-[#862334]" : ""
                  }`}
                />
              </button>

              {isTermOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  {TERM_OPTIONS.map((option) => {
                    const isSelected = term === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setTerm(option);
                          setIsTermOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#862334] text-white"
                            : "text-gray-700 hover:bg-[#862334]/10 hover:text-[#862334]"
                        }`}
                      >
                        <span className="truncate">{option}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Course Card Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Course Card Color
            </label>

            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.label}
                  onClick={() => setSelectedColor(opt.value)}
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
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#862334] hover:bg-[#701c2b] rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Add Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}