import mammoth from 'mammoth';

export const parseDocxToStudentList = async (file: File): Promise<string[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    return text
      .split('\n')
      .map(line => line.trim())
      // Menghilangkan baris kosong dan judul file agar hanya nama yang tersisa
      .filter(line => line !== "" && line.toUpperCase() !== "NAMA SISWA");
  } catch (error) {
    console.error("Gagal membaca file .docx:", error);
    return [];
  }
};
