import axios from 'axios';

// Base URL of the Express backend
const API_URL = 'http://localhost:5000/api/employees';

const getAllEmployees = () => axios.get(API_URL);

const getEmployee = (id) => axios.get(`${API_URL}/${id}`);

const createEmployee = (employeeData) => axios.post(API_URL, employeeData);

const updateEmployee = (id, employeeData) => axios.put(`${API_URL}/${id}`, employeeData);

const deleteEmployee = (id) => axios.delete(`${API_URL}/${id}`);

export default {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
