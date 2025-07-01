import userService from '../services/userService.js';

const userController = {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      console.error('💥 getAllUsers error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  },

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (err) {
      console.error('💥 getUserById error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  },

  async createUser(req, res) {
    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: newUser });
    } catch (err) {
      console.error('💥 createUser error:', err);
      res.status(500).json({ success: false, message: 'Failed to create user' });
    }
  },

  async updateUser(req, res) {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: updatedUser });
    } catch (err) {
      console.error('💥 updateUser error:', err);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  },

  async deleteUser(req, res) {
    try {
      await userService.deleteUser(req.params.id);
      res.status(204).end();
    } catch (err) {
      console.error('💥 deleteUser error:', err);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }
};

export default userController;
