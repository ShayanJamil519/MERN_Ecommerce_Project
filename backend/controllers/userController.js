const User = require('../models/userModel')
const ErrorHandler = require('../utils/errorhandler')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const sendToken = require('../utils/jwttoken')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')
const cloudinary = require('cloudinary')

// Register a User
exports.registerUser = catchAsyncErrors(async(req, res, next) => {
    const myClound = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: 'scale',
    })

    const { name, email, password } = req.body

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myClound.public_id,
            url: myClound.secure_url,
        },
    })

    sendToken(user, 201, res)
})

// Login User
exports.loginUser = catchAsyncErrors(async(req, res, next) => {
    const { email, password } = req.body

    // Checking if user has given email and password both
    if (!email || !password) {
        return next(new ErrorHandler('Please Enter Email and Password', 400))
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    const isPasswordMatched = await user.comparePassword(password)

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    sendToken(user, 200, res)
})

// Logout User
exports.logout = catchAsyncErrors(async(req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })

    res.status(200).json({
        success: true,
        message: 'Logged Out Successfully',
    })
})

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async(req, res, next) => {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new ErrorHandler('User not found', 404))
    }

    // Generating ResetPasswordToken
    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    // To Send email to client for resetting password
    const resetPasswordUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/password/reset/${resetToken}`

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Ecommerce Password Recovery',
            message,
        })

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        })
    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave: false })

        return next(new ErrorHandler(error.message, 500))
    }
})

// Reset Password
exports.resetPassword = catchAsyncErrors(async(req, res, next) => {
    // Creating token Hash
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
        return next(
            new ErrorHandler(
                'Reset Password token is invalid or has been expired',
                404,
            ),
        )
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password doesn't match", 404))
    }

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    sendToken(user, 200, res)
})

// Get User Details
exports.getUserDetails = catchAsyncErrors(async(req, res, next) => {
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        user,
    })
})

// Update User Password
exports.updatePassword = catchAsyncErrors(async(req, res, next) => {
    const user = await User.findById(req.user.id).select('+password')

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword)

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Old Password is incorrect', 400))
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password doesn't match", 400))
    }

    user.password = req.body.newPassword
    await user.save()

    sendToken(user, 200, res)
})

// Update User Profile:
exports.updateProfile = catchAsyncErrors(async(req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    if (req.body.avatar !== '') {
        const user = await User.findById(req.user.id)

        const imageId = user.avatar.public_id
        await cloudinary.v2.uploader.destroy(imageId)

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: 'scale',
        })

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success: true,
        user,
    })
})

// Get All Users (admin)
exports.getAllUsers = catchAsyncErrors(async(req, res, next) => {
    const users = await User.find()

    res.status(200).json({
        success: true,
        users,
    })
})

// Get Single User seen by (admin)
exports.getSingleUser = catchAsyncErrors(async(req, res, next) => {
    const user = await User.findById(req.params.id)

    if (!user) {
        return next(
            new ErrorHandler(`User doesn't exists with id:${req.params.id}`),
        )
    }

    res.status(200).json({
        success: true,
        user,
    })
})

// Update User Role -Admin
exports.updateUserRole = catchAsyncErrors(async(req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    if (!user) {
        return next(
            new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 400),
        )
    }

    res.status(200).json({
        success: true,
    })
})

// Delete User Role -Admin
exports.deleteUser = catchAsyncErrors(async(req, res, next) => {
    const user = await User.findById(req.params.id)

    if (!user) {
        return next(
            new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 400),
        )
    }

    const imageId = user.avatar.public_id
    await cloudinary.v2.uploader.destroy(imageId)

    await user.remove()

    res.status(200).json({
        success: true,
        message: 'User deleted successfully',
    })
})