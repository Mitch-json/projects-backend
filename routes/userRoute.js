const express = require('express');
const router = express();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { Result } = require('express-validator');

router.post('/profile', async (req, res)=>{
    const newHashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    User.findOne({email: req.body.email}, (err, user)=>{
        if(err) throw err;
        if (user) {
            bcrypt.compare(req.body.oldPassword, user.password, (err, result)=>{
                if(err) throw err;
                if(result){
                    User.updateOne({email: req.body.email}, {password: newHashedPassword}, (err, update)=>{
                        if(err) throw err;
                        if(update){
                            res.status(200).send({msg: 'Password Sucessfully changed'});
                        }else{
                            res.send({err: 'Password not updated'});
                        }
                    })
                }else{
                    res.status(200).send({err: 'incorrect old password'});
                }
            })
        }
    });
});

module.exports = router